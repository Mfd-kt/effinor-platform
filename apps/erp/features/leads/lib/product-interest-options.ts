/** Libellés alignés sur `normalizeProductInterestLabel` / analyse IA. */
export const PRODUCT_INTEREST_QUICK_OPTIONS = [
  { value: "Destratificateur", label: "Destratificateur d'air" },
  { value: "PAC", label: "PAC (pompe à chaleur)" },
  { value: "Luminaire LED", label: "Luminaire LED" },
] as const;

export const PRODUCT_INTEREST_QUICK_VALUE_SET = new Set(
  PRODUCT_INTEREST_QUICK_OPTIONS.map((o) => o.value),
);

export const PRODUCT_INTEREST_CUSTOM_SENTINEL = "__custom__";
