import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadGenerationPreparedStockRow } from "../domain/prepared-row";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import {
  findAdvancedDuplicateLeadGenerationStock,
  type AdvancedDuplicateFindResult,
} from "../dedup/find-advanced-duplicate-lead-generation-stock";

export type { AdvancedDuplicateFindResult };

/**
 * @deprecated Préférer {@link findAdvancedDuplicateLeadGenerationStock} pour le score / motifs.
 * Rétrocompat : retourne uniquement la fiche d’origine.
 */
export async function findDuplicateLeadGenerationStock(
  supabase: SupabaseClient,
  prepared: LeadGenerationPreparedStockRow,
): Promise<LeadGenerationStockRow | null> {
  const r = await findAdvancedDuplicateLeadGenerationStock(supabase, prepared);
  return r?.duplicateOf ?? null;
}

export { findAdvancedDuplicateLeadGenerationStock };
