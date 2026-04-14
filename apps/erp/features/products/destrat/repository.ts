import { DESTRAT_CATALOG } from "./catalog";
import type { DestratProduct, DestratProductId, DestratProductRepository } from "./types";

/**
 * Implémentation catalogue en mémoire (TypeScript).
 *
 * Future migration path: replace local catalog lookup by Supabase-backed repository
 * without changing PDF rendering / view-model mapping — implémenter la même interface
 * `DestratProductRepository` et injecter l’instance au build du view model.
 */
export function createLocalDestratProductRepository(): DestratProductRepository {
  function getById(id: DestratProductId): DestratProduct | null {
    const p = DESTRAT_CATALOG[id];
    return p?.isActive ? p : null;
  }

  return {
    getById,
    getByIds(ids: DestratProductId[]): DestratProduct[] {
      const seen = new Set<DestratProductId>();
      const out: DestratProduct[] = [];
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        const p = getById(id);
        if (p) out.push(p);
      }
      return out.sort((a, b) => a.sortOrder - b.sortOrder);
    },
  };
}

/** Instance singleton prête à l’emploi (PDF, tests). */
export const localDestratProductRepository = createLocalDestratProductRepository();
