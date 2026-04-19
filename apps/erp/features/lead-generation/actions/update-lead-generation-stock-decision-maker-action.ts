"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationMyQueue,
  canBypassLeadGenMyQueueAsImpersonationActor,
} from "@/lib/auth/module-access";
import { lgTable } from "@/features/lead-generation/lib/lg-db";
import { getLeadGenerationMyQueueStockPageDetail } from "@/features/lead-generation/queries/get-lead-generation-stock-for-agent";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid("Identifiant de fiche invalide.");

const inputSchema = z.object({
  stockId: uuid,
  decisionMakerName: z.string().trim().max(300).optional().nullable(),
  decisionMakerRole: z.string().trim().max(300).optional().nullable(),
});

export type UpdateLeadGenerationStockDecisionMakerResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateLeadGenerationStockDecisionMakerAction(
  input: unknown,
): Promise<UpdateLeadGenerationStockDecisionMakerResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    return { ok: false, error: "Accès refusé." };
  }

  const bypass = canBypassLeadGenMyQueueAsImpersonationActor(access);
  const detail = await getLeadGenerationMyQueueStockPageDetail(parsed.data.stockId, access.userId, bypass);
  if (!detail) {
    return { ok: false, error: "Fiche introuvable ou non accessible." };
  }

  const { stock, openedViaSupportBypass, currentAssignmentAgentId } = detail;
  if (stock.converted_lead_id) {
    return { ok: false, error: "Fiche déjà convertie : modification impossible." };
  }

  const supportLocksEdit =
    Boolean(openedViaSupportBypass) &&
    Boolean(currentAssignmentAgentId) &&
    currentAssignmentAgentId !== access.userId;
  if (supportLocksEdit) {
    return { ok: false, error: "Saisie désactivée en vue support pour cette attribution." };
  }

  const name = parsed.data.decisionMakerName?.trim() || null;
  const role = parsed.data.decisionMakerRole?.trim() || null;

  const supabase = await createClient();
  const stockTable = lgTable(supabase, "lead_generation_stock");

  const { error } = await stockTable
    .update({
      decision_maker_name: name,
      decision_maker_role: role,
      has_decision_maker: Boolean(name),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.stockId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${parsed.data.stockId}`);
  revalidatePath("/agent");

  return { ok: true };
}
