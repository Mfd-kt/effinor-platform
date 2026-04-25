import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Dédup intra-batch + dédup vs DB par `normalized_phone`.
 *
 * Pourquoi ne pas utiliser `upsert(..., { onConflict: "normalized_phone" })` ?
 *  - Dépend d'une contrainte unique en DB qui peut ne pas exister selon
 *    l'historique des migrations chez le client.
 *  - PostgREST cache parfois un schéma stale → erreurs cryptiques.
 *  - Une dédup côté JS est déterministe, instrumentable et indépendante du DDL.
 *
 * Comportement :
 *  - Lignes sans téléphone (`normalized_phone == null`) → toujours conservées
 *    (visibilité, même si pas appelables).
 *  - Doublons intra-batch (même `normalized_phone` apparaissant deux fois dans
 *    le chunk courant) → on garde la 1ʳᵉ occurrence.
 *  - Doublons vs stock existant (même `normalized_phone` déjà en DB,
 *    toutes sources confondues) → on filtre.
 */
export async function filterRowsByExistingPhone<T extends { normalized_phone: string | null }>(
  supabase: SupabaseClient<Database>,
  rows: readonly T[],
): Promise<{
  toInsert: T[];
  intraBatchDuplicates: number;
  dbDuplicates: number;
}> {
  if (rows.length === 0) {
    return { toInsert: [], intraBatchDuplicates: 0, dbDuplicates: 0 };
  }

  // 1) Dédup intra-batch
  const seen = new Set<string>();
  const uniqInBatch: T[] = [];
  let intraBatchDuplicates = 0;
  for (const r of rows) {
    if (!r.normalized_phone) {
      uniqInBatch.push(r);
      continue;
    }
    if (seen.has(r.normalized_phone)) {
      intraBatchDuplicates += 1;
      continue;
    }
    seen.add(r.normalized_phone);
    uniqInBatch.push(r);
  }

  // 2) Dédup vs stock existant
  const phones = uniqInBatch.map((r) => r.normalized_phone).filter((p): p is string => Boolean(p));
  if (phones.length === 0) {
    return { toInsert: uniqInBatch, intraBatchDuplicates, dbDuplicates: 0 };
  }

  const existing = new Set<string>();
  const LOOKUP_CHUNK = 500;
  for (let i = 0; i < phones.length; i += LOOKUP_CHUNK) {
    const slice = phones.slice(i, i + LOOKUP_CHUNK);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("lead_generation_stock")
      .select("normalized_phone")
      .in("normalized_phone", slice);
    if (error) {
      console.warn("[dedup-by-phone] lookup error, on continue sans filtre DB", error.message);
      break;
    }
    for (const row of (data ?? []) as Array<{ normalized_phone: string | null }>) {
      if (row.normalized_phone) existing.add(row.normalized_phone);
    }
  }

  let dbDuplicates = 0;
  const toInsert = uniqInBatch.filter((r) => {
    if (!r.normalized_phone) return true;
    if (existing.has(r.normalized_phone)) {
      dbDuplicates += 1;
      return false;
    }
    return true;
  });

  return { toInsert, intraBatchDuplicates, dbDuplicates };
}
