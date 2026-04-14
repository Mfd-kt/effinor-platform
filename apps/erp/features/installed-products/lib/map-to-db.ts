import type { Database } from "@/types/database.types";

import type { InstalledProductInsertInput } from "@/features/installed-products/schemas/installed-product.schema";

type InsertRow = Database["public"]["Tables"]["installed_products"]["Insert"];

export function insertFromInstalledProductForm(data: InstalledProductInsertInput): InsertRow {
  return {
    product_id: data.product_id,
    quantity: data.quantity,
    unit_price_ht: data.unit_price_ht ?? null,
    total_price_ht: data.total_price_ht ?? null,
    unit_power_w: data.unit_power_w ?? null,
    cee_sheet_code: data.cee_sheet_code?.trim() ? data.cee_sheet_code.trim() : null,
    cumac_amount: data.cumac_amount ?? null,
    valuation_amount: data.valuation_amount ?? null,
    notes: data.notes?.trim() ? data.notes.trim() : null,
  };
}
