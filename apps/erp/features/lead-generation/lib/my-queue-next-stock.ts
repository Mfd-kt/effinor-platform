import type { MyLeadGenerationQueueItem } from "../queries/get-my-lead-generation-queue";

/**
 * Prochaine fiche dans la file « Ma file », même tri / filtres que `getMyLeadGenerationQueue`.
 */
export function getNextMyQueueStockIdAfter(
  queueItems: MyLeadGenerationQueueItem[],
  currentStockId: string,
): string | null {
  const idx = queueItems.findIndex((i) => i.stockId === currentStockId);
  if (idx < 0 || idx >= queueItems.length - 1) {
    return null;
  }
  return queueItems[idx + 1]!.stockId;
}

/**
 * Première fiche disponible dans la file (ex. fiche courante absente du résultat car déjà convertie).
 */
export function getFirstMyQueueStockId(queueItems: MyLeadGenerationQueueItem[]): string | null {
  return queueItems[0]?.stockId ?? null;
}
