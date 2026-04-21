"use server";

import { z } from "zod";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationMyQueue } from "@/lib/auth/module-access";

import { getMyLeadGenerationQueue } from "../queries/get-my-lead-generation-queue";

const inputSchema = z.object({
  currentStockId: z.string().uuid("Identifiant de fiche invalide."),
});

export type ResolveNextMyQueueStockIdResult =
  | { ok: true; nextStockId: string | null }
  | { ok: false; error: string };

/**
 * Recalcule la prochaine fiche depuis la file serveur la plus fraîche
 * (évite les snapshots périmés en navigation détaillée).
 */
export async function resolveNextMyQueueStockIdAction(
  input: unknown,
): Promise<ResolveNextMyQueueStockIdResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessLeadGenerationMyQueue(access)) {
    return { ok: false, error: "Accès refusé." };
  }

  try {
    const queue = await getMyLeadGenerationQueue(access.userId);
    const idx = queue.findIndex((x) => x.stockId === parsed.data.currentStockId);
    if (idx < 0 || idx >= queue.length - 1) {
      return { ok: true, nextStockId: null };
    }
    return { ok: true, nextStockId: queue[idx + 1]!.stockId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Impossible de résoudre la fiche suivante.",
    };
  }
}

