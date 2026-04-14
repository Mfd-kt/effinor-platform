import { toPdfStudyProductFromDetails } from "@/features/products/domain/mappers";
import type { ProductWithDetails } from "@/features/products/domain/types";

import { STUDY_PAC_PRODUCT_RATIONALE } from "./resolve-study-products";
import type { StudyProductViewModel } from "./types";

/**
 * Adapte une fiche produit Supabase au format PDF étude.
 * `id` = `product_code` pour rester compatible avec l’enrichissement images (`generate-lead-study-pdf`).
 */
export function toStudyProductViewModelFromDetails(
  p: ProductWithDetails,
  rationaleText: string = STUDY_PAC_PRODUCT_RATIONALE,
): StudyProductViewModel {
  const base = toPdfStudyProductFromDetails(p, rationaleText);
  return {
    ...base,
    id: p.product_code,
  };
}
