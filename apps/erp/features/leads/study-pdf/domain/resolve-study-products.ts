import {
  localDestratProductRepository,
  resolveProductImageUrl,
  type DestratProduct,
  type DestratProductId,
  type DestratProductRepository,
} from "../../../products";

import type { StudyProductViewModel } from "./types";
import type { PdfStudyProductViewModel, ProductWithDetails } from "../../../../features/products/domain/types";
import { toPdfStudyProductFromDetails } from "../../../../features/products/domain/mappers";

const KNOWN_IDS: DestratProductId[] = ["teddington_ds3", "teddington_ds7", "generfeu"];

const DEFAULT_RATIONALE =
  "Modèle retenu au regard de la hauteur, du volume traité et des hypothèses de brassage considérées au stade préliminaire.";

/**
 * Interprète une chaîne issue du lead (`sim_model`, saisie libre éventuelle) vers un id catalogue.
 */
export function parseDestratProductId(raw: string | null | undefined): DestratProductId | null {
  if (raw == null || !String(raw).trim()) return null;
  const n = String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if ((KNOWN_IDS as string[]).includes(n)) {
    return n as DestratProductId;
  }
  for (const id of KNOWN_IDS) {
    if (n.includes(id)) return id;
  }
  return null;
}

/**
 * Déduit la liste d'ids produits pour l'étude : modèle principal + ids additionnels (multi-produit).
 * Les ids sont dédupliqués et triés selon `sortOrder` du catalogue via le repository.
 */
export function resolveDestratProductIdsForStudy(
  modelKey: string | null | undefined,
  extraIds?: DestratProductId[] | null,
): DestratProductId[] {
  const unique = new Set<DestratProductId>();
  const primary = parseDestratProductId(modelKey);
  if (primary) unique.add(primary);
  for (const id of extraIds ?? []) {
    if (KNOWN_IDS.includes(id)) unique.add(id);
  }
  return localDestratProductRepository.getByIds([...unique]).map((p) => p.id);
}

function mapProductToStudyVm(product: DestratProduct): StudyProductViewModel {
  return {
    id: product.id,
    displayName: product.name,
    description: product.description,
    imageUrlResolved: resolveProductImageUrl(product),
    galleryUrls: [],
    specsForDisplay: product.specs.slice(0, 6),
    keyMetricsForDisplay: product.keyMetrics.slice(0, 3),
    rationaleText: DEFAULT_RATIONALE,
  };
}

/**
 * Résout les fiches produit via le catalogue local (synchrone — backward compat).
 */
export function resolveStudyProductsForPdf(
  modelKey: string | null | undefined,
  options?: {
    extraProductIds?: DestratProductId[] | null;
    repository?: DestratProductRepository;
  },
): StudyProductViewModel[] {
  const repo = options?.repository ?? localDestratProductRepository;
  const ids = resolveDestratProductIdsForStudy(modelKey, options?.extraProductIds ?? null);
  const products = repo.getByIds(ids);
  return products.map(mapProductToStudyVm);
}

// ---------------------------------------------------------------------------
// Supabase-backed async variant
// ---------------------------------------------------------------------------

/**
 * Résout les fiches produit via la base Supabase (async).
 * Retourne des `PdfStudyProductViewModel` (types domain, pas legacy).
 * Utilisable quand un client Supabase est disponible (server action / route handler).
 */
export async function resolveStudyProductsFromDb(
  productCodes: string[],
  fetcher: (codes: string[]) => Promise<ProductWithDetails[]>,
  rationaleText?: string,
): Promise<PdfStudyProductViewModel[]> {
  if (productCodes.length === 0) return [];
  const products = await fetcher(productCodes);
  return products.map((p) => toPdfStudyProductFromDetails(p, rationaleText));
}
