"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import type { Json } from "../domain/json";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { lgTable } from "../lib/lg-db";
import { evaluateLeadGenerationDispatchQueue } from "../queue/evaluate-dispatch-queue";
import { compactLeadGenerationStockAuditSnapshot } from "../services/review-lead-generation-stock";
import { insertLeadGenerationManualReviewRow } from "../services/insert-lead-generation-manual-review";
import { isLeadGenerationStockOperational, leadGenerationConvertedStockMessage } from "../lib/lead-generation-operational-scope";

type RpcReturnRow = { result_code: string };

function mapReturnRpc(raw: RpcReturnRow[] | RpcReturnRow | null | undefined): string | null {
  const row = Array.isArray(raw) ? raw[0] : raw ?? undefined;
  const code = row?.result_code;
  if (code === "success") return null;
  switch (code) {
    case "not_found":
      return "Attribution introuvable.";
    case "forbidden":
      return "Vous n’êtes pas le commercial assigné à cette fiche.";
    case "already_converted":
      return "Cette fiche est déjà traitée côté CRM.";
    case "invalid_assignment_state":
      return "Cette fiche n’est plus dans votre file.";
    case "stock_not_found":
      return "Fiche introuvable.";
    case "stock_mismatch":
      return "Incohérence attribution / fiche (contactez le support).";
    case "not_qualified_for_return":
      return "Seules les fiches qualifiées peuvent être renvoyées en quantification.";
    default:
      return code ? "Action impossible pour le moment." : "Réponse serveur inattendue.";
  }
}

export type ReturnLeadGenerationStockToQuantificationResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Commercial : renvoie la fiche en file quantification (`to_validate`) sans la marquer hors cible.
 */
export async function returnLeadGenerationStockToQuantificationAction(
  stockId: string,
  note?: string | null,
): Promise<ReturnLeadGenerationStockToQuantificationResult> {
  const id = stockId?.trim();
  if (!id) {
    return { ok: false, message: "Fiche invalide." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    return { ok: false, message: "Accès refusé." };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: stockRow, error: loadErr } = await stockTable
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadErr || !stockRow) {
    return { ok: false, message: "Fiche introuvable." };
  }

  const before = stockRow as LeadGenerationStockRow;
  if (!isLeadGenerationStockOperational(before)) {
    return { ok: false, message: leadGenerationConvertedStockMessage() };
  }
  const aid = before.current_assignment_id?.trim() ?? null;
  if (!aid) {
    return { ok: false, message: "Aucune attribution active sur cette fiche." };
  }

  const trimmedNote = note?.trim() || null;

  const { data: rpcRaw, error: rpcErr } = await supabase.rpc("return_lead_generation_assignment_to_quantification", {
    p_assignment_id: aid,
    p_agent_id: access.userId,
    p_note: trimmedNote,
  });

  if (rpcErr) {
    return { ok: false, message: "Action impossible pour le moment." };
  }

  const errMsg = mapReturnRpc(rpcRaw as RpcReturnRow[] | RpcReturnRow | null);
  if (errMsg) {
    return { ok: false, message: errMsg };
  }

  const { data: afterRow } = await stockTable.select("*").eq("id", id).maybeSingle();
  if (afterRow) {
    const ins = await insertLeadGenerationManualReviewRow({
      stockId: id,
      reviewedByUserId: access.userId,
      reviewType: "agent_return_review",
      reviewDecision: "commercial_return_to_quantification",
      reviewNotes: trimmedNote,
      previousSnapshot: compactLeadGenerationStockAuditSnapshot(before) as unknown as Json,
      newSnapshot: compactLeadGenerationStockAuditSnapshot(afterRow as LeadGenerationStockRow) as unknown as Json,
    });
    if (!ins.ok) {
      return { ok: false, message: ins.error };
    }
  }

  try {
    await evaluateLeadGenerationDispatchQueue({ stockId: id });
  } catch {
    /* ne bloque pas le renvoi */
  }

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath(`/lead-generation/${id}`);
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${id}`);
  revalidatePath("/lead-generation/quantification");
  revalidatePath(`/lead-generation/quantification/${id}`);

  return { ok: true, message: "Fiche renvoyée en quantification pour relecture." };
}
