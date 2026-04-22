"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";

import type { DispatchLeadGenerationStockResult } from "../domain/dispatch-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { MY_QUEUE_NO_CEE_SHEET_SENTINEL } from "../lib/my-queue-cee-sheet-option";
import { MY_QUEUE_MANUAL_CHUNK_DEFAULT } from "../lib/my-queue-manual-dispatch";
import { getLeadGenerationMyQueueCeeSheetOptions } from "../queries/get-lead-generation-my-queue-cee-sheet-options";
import { getLeadGenerationDispatchPolicyConfig } from "../queries/get-lead-generation-dispatch-policy-config";
import { dispatchLeadGenerationMyQueueChunkForAgent } from "../services/dispatch-lead-generation-stock";

/**
 * Récupère un lot de fiches `ready_now` pour l’agent connecté (ex. +20 depuis « Mes fiches à traiter »).
 */
export async function dispatchLeadGenerationMyQueueChunkAction(
  input?: unknown,
): Promise<LeadGenerationActionResult<DispatchLeadGenerationStockResult>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    return { ok: false, error: "Accès refusé." };
  }

  const supabase = await createClient();
  const policyCfg = await getLeadGenerationDispatchPolicyConfig(supabase);
  const maxChunkRequest = policyCfg.effectiveCapMax;

  const inputSchema = z.object({
    chunkSize: z.number().int().min(1).max(maxChunkRequest).optional(),
    /** Fiche CEE (UUID) ou sentinelle « sans fiche ». */
    ceeSheetId: z.string().min(1).max(120).optional(),
  });

  const parsed = inputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  const chunkSize = parsed.data.chunkSize ?? MY_QUEUE_MANUAL_CHUNK_DEFAULT;
  const sheetOptions = await getLeadGenerationMyQueueCeeSheetOptions(access);
  const rawCee = parsed.data.ceeSheetId?.trim() || null;
  const isNoCeeScope = rawCee === MY_QUEUE_NO_CEE_SHEET_SENTINEL;
  const ceeSheetIdForDispatch = isNoCeeScope ? null : rawCee;

  if (sheetOptions.length > 0) {
    if (!rawCee) {
      return { ok: false, error: "Choisissez une fiche CEE avant de récupérer des fiches." };
    }
    if (!isNoCeeScope && !sheetOptions.some((o) => o.id === rawCee)) {
      return { ok: false, error: "Cette fiche CEE n’est pas disponible pour votre compte." };
    }
  }

  try {
    const data = await dispatchLeadGenerationMyQueueChunkForAgent(access.userId, chunkSize, ceeSheetIdForDispatch);
    revalidatePath("/lead-generation/my-queue");
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la récupération des fiches.";
    return { ok: false, error: message };
  }
}
