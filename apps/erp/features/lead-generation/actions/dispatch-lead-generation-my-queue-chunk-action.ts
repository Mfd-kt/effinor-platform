"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";

import type { DispatchLeadGenerationStockResult } from "../domain/dispatch-result";
import type { LeadGenerationActionResult } from "../lib/action-result";
import { MY_QUEUE_MANUAL_CHUNK_DEFAULT, MY_QUEUE_MAX_ACTIVE_STOCK } from "../lib/my-queue-manual-dispatch";
import { dispatchLeadGenerationMyQueueChunkForAgent } from "../services/dispatch-lead-generation-stock";

const inputSchema = z
  .object({
    chunkSize: z.number().int().min(1).max(MY_QUEUE_MAX_ACTIVE_STOCK).optional(),
  })
  .default({});

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

  const parsed = inputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  const chunkSize = parsed.data.chunkSize ?? MY_QUEUE_MANUAL_CHUNK_DEFAULT;

  try {
    const data = await dispatchLeadGenerationMyQueueChunkForAgent(access.userId, chunkSize);
    revalidatePath("/lead-generation/my-queue");
    revalidatePath("/agent");
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la récupération des fiches.";
    return { ok: false, error: message };
  }
}
