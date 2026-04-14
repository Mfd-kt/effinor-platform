import type { ProductFamily } from "@/types/database.types";

/** Catégorie texte `products.category` — deux lignes principales CEE / simulateur. */
export const CEE_PRODUCT_CATEGORY = {
  destrat: "destratificateur",
  pac: "pac",
} as const;

export type CeeProductCategoryValue = (typeof CEE_PRODUCT_CATEGORY)[keyof typeof CEE_PRODUCT_CATEGORY];

export const CEE_CATEGORY_OPTIONS: { value: CeeProductCategoryValue; label: string }[] = [
  {
    value: CEE_PRODUCT_CATEGORY.destrat,
    label: "Déstratificateur (fiche CEE déstrat, simulateur déstrat)",
  },
  {
    value: CEE_PRODUCT_CATEGORY.pac,
    label: "Pompe à chaleur (fiche CEE PAC, simulateur pac)",
  },
];

export const PRODUCT_FAMILY_OPTIONS: { value: ProductFamily; label: string }[] = [
  { value: "heat_pump", label: "Pompe à chaleur" },
  { value: "destratification", label: "Déstratification" },
  { value: "lighting_led", label: "Éclairage LED" },
  { value: "balancing", label: "Équilibrage" },
  { value: "heat_recovery", label: "Récupération de chaleur" },
  { value: "other", label: "Autre" },
];

const FAMILY_LABELS = Object.fromEntries(
  PRODUCT_FAMILY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ProductFamily, string>;

export function productFamilyLabel(family: ProductFamily | null): string {
  if (!family) return "—";
  return FAMILY_LABELS[family] ?? family;
}
