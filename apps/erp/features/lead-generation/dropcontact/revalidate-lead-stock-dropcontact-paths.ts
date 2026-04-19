import { revalidatePath } from "next/cache";

import { logDropcontact } from "./dropcontact-log";

/**
 * Invalide les routes liste + fiche hub + fiche file pour une même fiche stock.
 */
export function revalidateLeadStockDropcontactPaths(stockId: string, origin: string): void {
  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/stock");
  revalidatePath(`/lead-generation/${stockId}`);
  revalidatePath("/lead-generation/my-queue");
  revalidatePath(`/lead-generation/my-queue/${stockId}`);
  logDropcontact("revalidate", "revalidatePath exécuté", { stockId, origin });
}
