import type { InstalledProductFormInput } from "@/features/installed-products/schemas/installed-product.schema";
import type { InstalledProductDetailRow, InstalledProductRow } from "@/features/installed-products/types";

export const EMPTY_INSTALLED_PRODUCT_FORM: InstalledProductFormInput = {
  product_id: "",
  quantity: 1,
  unit_price_ht: undefined,
  total_price_ht: undefined,
  unit_power_w: undefined,
  cee_sheet_code: undefined,
  cumac_amount: undefined,
  valuation_amount: undefined,
  notes: undefined,
};

export function installedProductRowToFormValues(
  row: InstalledProductRow | InstalledProductDetailRow,
): InstalledProductFormInput {
  return {
    product_id: row.product_id,
    quantity: row.quantity,
    unit_price_ht: row.unit_price_ht ?? undefined,
    total_price_ht: row.total_price_ht ?? undefined,
    unit_power_w: row.unit_power_w ?? undefined,
    cee_sheet_code: row.cee_sheet_code ?? undefined,
    cumac_amount: row.cumac_amount ?? undefined,
    valuation_amount: row.valuation_amount ?? undefined,
    notes: row.notes ?? undefined,
  };
}
