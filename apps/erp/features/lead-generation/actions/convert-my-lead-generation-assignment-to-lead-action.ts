"use server";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import type { ConvertLeadGenerationAssignmentResult } from "../domain/convert-assignment-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { lgTable } from "../lib/lg-db";
import { convertMyLeadGenerationStockParamSchema } from "../schemas/lead-generation-actions.schema";
import { convertLeadGenerationAssignmentToLead } from "../services/convert-lead-generation-assignment-to-lead";

/**
 * Conversion avec agent = utilisateur courant (vue « Ma file »).
 */
export async function convertMyLeadGenerationAssignmentToLeadAction(
  input: unknown,
): Promise<LeadGenerationActionResult<ConvertLeadGenerationAssignmentResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = convertMyLeadGenerationStockParamSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { data: st, error: sErr } = await stockTable
    .select("id, current_assignment_id, converted_lead_id")
    .eq("id", parsed.data.stockId)
    .maybeSingle();

  if (sErr) {
    return { ok: false, error: sErr.message };
  }
  if (!st) {
    return { ok: false, error: "Fiche introuvable." };
  }

  const stock = st as {
    id: string;
    current_assignment_id: string | null;
    converted_lead_id: string | null;
  };

  if (stock.converted_lead_id) {
    return { ok: false, error: "Cette fiche est déjà convertie." };
  }
  if (!stock.current_assignment_id) {
    return { ok: false, error: "Aucune attribution active sur cette fiche." };
  }

  const assignments = lgTable(supabase, "lead_generation_assignments");
  const { data: asn, error: aErr } = await assignments
    .select("id, agent_id")
    .eq("id", stock.current_assignment_id)
    .maybeSingle();

  if (aErr || !asn) {
    return { ok: false, error: "Attribution introuvable." };
  }

  const row = asn as { id: string; agent_id: string };
  if (row.agent_id !== access.userId) {
    return { ok: false, error: "Vous ne pouvez convertir que vos propres fiches." };
  }

  try {
    const data = await convertLeadGenerationAssignmentToLead({
      assignmentId: row.id,
      agentId: access.userId,
    });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la conversion.";
    return { ok: false, error: message };
  }
}
