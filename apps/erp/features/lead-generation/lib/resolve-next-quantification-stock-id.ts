import type { AccessContext } from "@/lib/auth/access-context";

import { getLeadGenerationQuantificationQueue } from "../queries/get-lead-generation-quantification-queue";
import { resolveQuantificationImportBatchScope } from "./quantification-viewer-scope";

/**
 * Fiche suivante dans la file quantificateur (ordre `created_at` asc., même périmètre que la liste).
 * À appeler **avant** la mutation : la fiche courante doit encore figurer dans la file.
 */
export async function resolveNextQuantificationStockId(
  access: AccessContext,
  currentStockId: string,
): Promise<string | null> {
  if (access.kind !== "authenticated") {
    return null;
  }
  const batchScope = await resolveQuantificationImportBatchScope(access);
  if (!batchScope) {
    return null;
  }
  const queue = await getLeadGenerationQuantificationQueue(200, batchScope);
  const idx = queue.findIndex((item) => item.stock.id === currentStockId);
  if (idx < 0 || idx + 1 >= queue.length) {
    return null;
  }
  return queue[idx + 1]?.stock.id ?? null;
}
