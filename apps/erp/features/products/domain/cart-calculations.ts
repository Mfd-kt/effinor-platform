import type { CartItemRow, ProductRow } from "./types";

type CartItemWithProduct = CartItemRow & { product: ProductRow };

export type CartTotals = {
  totalItems: number;
  totalQuantity: number;
  subtotalHt: number;
};

export function computeLineTotalHt(
  quantity: number,
  unitPriceHt: number | null,
): number | null {
  if (unitPriceHt == null) return null;
  return Math.round(unitPriceHt * quantity * 100) / 100;
}

export function computeCartTotals(items: CartItemWithProduct[]): CartTotals {
  let totalQuantity = 0;
  let subtotalHt = 0;

  for (const item of items) {
    totalQuantity += item.quantity;
    const effectivePrice = item.unit_price_ht ?? item.product.default_price_ht;
    if (effectivePrice != null) {
      subtotalHt += effectivePrice * item.quantity;
    }
  }

  return {
    totalItems: items.length,
    totalQuantity: Math.round(totalQuantity * 10000) / 10000,
    subtotalHt: Math.round(subtotalHt * 100) / 100,
  };
}
