"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canAccessLeadGenerationQuantification,
} from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { assertQuantifierMayActOnQuantificationStock } from "../lib/quantification-batch-ownership";
import { lgTable } from "../lib/lg-db";
import { resolveNextQuantificationStockId } from "../lib/resolve-next-quantification-stock-id";
import { normalizeLeadGenOutOfTargetReasonCode } from "../lib/out-of-target";
import { compactLeadGenerationStockAuditSnapshot } from "../services/review-lead-generation-stock";
import { insertLeadGenerationManualReviewRow } from "../services/insert-lead-generation-manual-review";

export type MarkLeadGenerationStockOutOfTargetResult =
  | { ok: true; message: string; nextStockId: string | null }
  | { ok: false; message: string };

/**
 * Hors cible définitif : réservé au quantificateur et au pilotage (hub).
 * Les commerciaux utilisent {@link returnLeadGenerationStockToQuantificationAction}.
 */
export async function markLeadGenerationStockOutOfTargetAction(
  stockId: string,
  options?: { outOfTargetReasonCode?: string | null },
): Promise<MarkLeadGenerationStockOutOfTargetResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const ootCode = normalizeLeadGenOutOfTargetReasonCode(options?.outOfTargetReasonCode);

  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, message: "Non authentifié." };
  }

  const hub = await canAccessLeadGenerationHub(access);
  const quant = canAccessLeadGenerationQuantification(access);
  if (!hub && !quant) {
    return { ok: false, message: "Accès refusé." };
  }

  const pilot = hub || quant;

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");
  const assignments = lgTable(supabase, "lead_generation_assignments");

  let beforeForAudit: LeadGenerationStockRow | null = null;
  if (pilot) {
    const { data: fullBefore } = await stockTable.select("*").eq("id", id).maybeSingle();
    if (fullBefore) {
      beforeForAudit = fullBefore as LeadGenerationStockRow;
    }
  }

  if (quant && beforeForAudit) {
    const batches = lgTable(supabase, "lead_generation_import_batches");
    let importBatch: { created_by_user_id: string | null } | null = null;
    if (beforeForAudit.import_batch_id?.trim()) {
      const { data: bRow } = await batches
        .select("created_by_user_id")
        .eq("id", beforeForAudit.import_batch_id.trim())
        .maybeSingle();
      importBatch = bRow as { created_by_user_id: string | null } | null;
    }
    const gate = await assertQuantifierMayActOnQuantificationStock(supabase, access, beforeForAudit, importBatch);
    if (!gate.ok) {
      return { ok: false, message: gate.message };
    }
  }

  const { data: stockRow, error: stockErr } = await stockTable
    .select("id, converted_lead_id, current_assignment_id, stock_status")
    .eq("id", id)
    .maybeSingle();

  if (stockErr || !stockRow) {
    return { ok: false, message: "Fiche introuvable." };
  }

  const stock = stockRow as {
    id: string;
    converted_lead_id: string | null;
    current_assignment_id: string | null;
    stock_status: string;
  };

  if (stock.converted_lead_id) {
    return { ok: false, message: "Cette fiche est déjà convertie." };
  }

  if (stock.stock_status === "rejected") {
    return { ok: true, message: "La fiche a été marquée hors cible.", nextStockId: null };
  }

  const nextStockId = await resolveNextQuantificationStockId(access, id);

  const aid = stock.current_assignment_id;

  const stockPatchRejected = {
    stock_status: "rejected" as const,
    qualification_status: "rejected" as const,
    current_assignment_id: null as string | null,
    rejection_reason: ootCode,
    dispatch_queue_status: "do_not_dispatch" as const,
    updated_at: new Date().toISOString(),
  };

  if (aid) {
    const { data: asg } = await assignments
      .select("id, agent_id, outcome")
      .eq("id", aid)
      .maybeSingle();

    const a = asg as { id: string; agent_id: string; outcome: string } | null;
    if (a && a.outcome === "pending" && pilot) {
      const noteQuant = `Hors cible (quantificateur) — ${ootCode}`;
      const noteHub = `Hors cible (pilotage) — ${ootCode}`;

      const { error: upAsg } = await assignments
        .update({
          outcome: "out_of_target",
          outcome_reason: ootCode,
          assignment_status: "consumed",
          consumed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          recycle_status: "closed",
          last_call_note: quant ? noteQuant : noteHub,
          updated_at: new Date().toISOString(),
        })
        .eq("id", aid)
        .eq("outcome", "pending");

      if (upAsg) {
        return { ok: false, message: "Action impossible pour le moment." };
      }

      const { error: upStock } = await stockTable
        .update(stockPatchRejected)
        .eq("id", id)
        .eq("current_assignment_id", aid)
        .is("converted_lead_id", null);

      if (upStock) {
        return { ok: false, message: "Action impossible pour le moment." };
      }
    } else {
      return { ok: false, message: "Cette fiche n’est plus modifiable depuis cet écran." };
    }
  } else if (pilot) {
    const { error: upStock } = await stockTable
      .update(stockPatchRejected)
      .eq("id", id)
      .is("converted_lead_id", null);

    if (upStock) {
      return { ok: false, message: "Action impossible pour le moment." };
    }
  } else {
    return { ok: false, message: "Attribuez-vous la fiche ou contactez un responsable." };
  }

  if (beforeForAudit) {
    const { data: afterRow } = await stockTable.select("*").eq("id", id).maybeSingle();
    if (afterRow) {
      if (quant) {
        await insertLeadGenerationManualReviewRow({
          stockId: id,
          reviewedByUserId: access.userId,
          reviewType: "quantifier_review",
          reviewDecision: "quantifier_out_of_target",
          reviewNotes: ootCode,
          previousSnapshot: compactLeadGenerationStockAuditSnapshot(beforeForAudit) as unknown as Json,
          newSnapshot: compactLeadGenerationStockAuditSnapshot(afterRow as LeadGenerationStockRow) as unknown as Json,
        });
      } else if (hub) {
        await insertLeadGenerationManualReviewRow({
          stockId: id,
          reviewedByUserId: access.userId,
          reviewType: "stock_review",
          reviewDecision: "close_stock",
          reviewNotes: `hors_cible_pilotage:${ootCode}`,
          previousSnapshot: compactLeadGenerationStockAuditSnapshot(beforeForAudit) as unknown as Json,
          newSnapshot: compactLeadGenerationStockAuditSnapshot(afterRow as LeadGenerationStockRow) as unknown as Json,
        });
      }
    }
  }

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath(`/lead-generation/${id}`);
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${id}`);
  revalidatePath("/lead-generation/quantification");
  revalidatePath(`/lead-generation/quantification/${id}`);

  return { ok: true, message: "La fiche a été marquée hors cible.", nextStockId };
}
