"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";
import { finalizeLeadGenerationConversionWithExistingLead } from "../services/convert-lead-generation-assignment-to-lead";

const schema = z.object({
  stockId: z.string().uuid(),
  leadId: z.string().uuid(),
});

export type AttachLeadGenerationConversionResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

/**
 * Appelé après validation / envoi simulateur agent : consomme la fiche lead-generation
 * et rattache le `lead` créé par le poste de travail.
 */
export async function attachLeadGenerationConversionAction(
  input: unknown,
): Promise<AttachLeadGenerationConversionResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    return { ok: false, error: "Accès refusé." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Paramètres invalides." };
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

  if (stock.converted_lead_id && stock.converted_lead_id !== parsed.data.leadId) {
    return { ok: false, error: "Cette prospection est déjà convertie." };
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

  const res = await finalizeLeadGenerationConversionWithExistingLead({
    assignmentId: row.id,
    agentId: access.userId,
    leadId: parsed.data.leadId,
  });

  if (res.status !== "success") {
    const msg =
      res.status === "already_converted"
        ? "Cette prospection était déjà convertie."
        : res.status === "forbidden"
          ? "Action non autorisée sur ce lead ou cette fiche."
          : res.status === "not_found"
            ? "Lead ou fiche introuvable."
            : res.status === "invalid_assignment_state"
              ? "État d’attribution invalide."
              : res.message ?? "Échec de la finalisation.";
    return { ok: false, error: msg };
  }

  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${parsed.data.stockId}`);
  revalidatePath(`/leads/${parsed.data.leadId}`);

  return { ok: true, leadId: res.leadId };
}
