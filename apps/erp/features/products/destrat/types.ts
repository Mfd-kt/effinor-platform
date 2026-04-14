import type { DestratModel } from "@/features/leads/simulator/domain/types";

/**
 * Identifiant catalogue — modèles simulateur déstrat + fiches PAC / autres (PDF, études).
 */
export type DestratProductId = DestratModel | "bosch_pac_air_eau";

export type ProductSpec = {
  label: string;
  value: string;
};

export type DestratProductCategory = "destratificateur" | "pac";

/**
 * Fiche produit complète (catalogue local ou future ligne DB).
 */
export type DestratProduct = {
  id: DestratProductId;
  brand: string;
  /** Dénomination commerciale / marketing contrôlée. */
  name: string;
  /** Libellé court pour en-têtes / listes. */
  shortLabel: string;
  /** Code technique stable (URL, exports, clés étrangères futures). */
  slug: string;
  category: DestratProductCategory;
  description: string;
  /**
   * URL principale du visuel produit (hébergement Effinor, CDN, etc.).
   * À renseigner quand l’asset est disponible — sinon laisser null et utiliser fallback ou placeholder PDF.
   */
  imageUrl: string | null;
  /**
   * Visuel de secours si `imageUrl` est indisponible (ex. autre angle, autre résolution).
   */
  fallbackImageUrl: string | null;
  /** Jusqu’à 6 paires label / valeur pour la fiche PDF. */
  specs: ProductSpec[];
  /** Jusqu’à 3 repères pour mise en avant dans le PDF. */
  keyMetrics: ProductSpec[];
  /** Ordre d’affichage dans les listes multi-produits. */
  sortOrder: number;
  isActive: boolean;
};

/** Vue légère pour listes / futures API (hors PDF). */
export type DestratProductSummary = Pick<DestratProduct, "id" | "brand" | "name" | "shortLabel" | "slug">;

/**
 * Abstraction de lecture catalogue.
 * Future migration path: replace local catalog lookup by Supabase-backed repository
 * without changing PDF rendering / view-model mapping (swap implementation at DI boundary).
 */
export interface DestratProductRepository {
  getById(id: DestratProductId): DestratProduct | null;
  getByIds(ids: DestratProductId[]): DestratProduct[];
}
