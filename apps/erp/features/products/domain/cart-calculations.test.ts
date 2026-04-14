import { describe, expect, it } from "vitest";

import { computeCartTotals, computeLineTotalHt } from "./cart-calculations";
import type { CartItemRow, ProductRow } from "./types";

function fakeProductRow(overrides?: Partial<ProductRow>): ProductRow {
  return {
    id: "p-1",
    brand: "X",
    reference: "R",
    product_code: "x",
    name: "Product X",
    short_label: null,
    category: "destratificateur",
    description: null,
    description_short: null,
    description_long: null,
    image_url: null,
    fallback_image_url: null,
    noise_db: null,
    airflow_m3h: null,
    max_throw: null,
    unit_power_w: null,
    luminous_efficiency: null,
    cri: null,
    unit_price_ht: null,
    default_price_ht: 1000,
    valuation: null,
    product_family: null,
    is_active: true,
    sort_order: 100,
    usage_contexts: [],
    unit_label: "unité",
    created_at: "",
    updated_at: "",
    deleted_at: null,
    ...overrides,
  } satisfies ProductRow as ProductRow;
}

function fakeCartItem(
  overrides: Partial<CartItemRow & { product: ProductRow }>,
): CartItemRow & { product: ProductRow } {
  return {
    id: "ci-1",
    cart_id: "c-1",
    product_id: "p-1",
    quantity: 1,
    unit_price_ht: null,
    line_total_ht: null,
    display_order: 100,
    metadata: {},
    created_at: "",
    updated_at: "",
    product: fakeProductRow(),
    ...overrides,
  };
}

describe("computeLineTotalHt", () => {
  it("returns qty * price rounded to 2 decimals", () => {
    expect(computeLineTotalHt(3, 1250.55)).toBe(3751.65);
  });

  it("returns null when price is null", () => {
    expect(computeLineTotalHt(3, null)).toBeNull();
  });
});

describe("computeCartTotals", () => {
  it("sums items correctly", () => {
    const items = [
      fakeCartItem({ quantity: 2, unit_price_ht: 1000, product: fakeProductRow({ default_price_ht: 1000 }) }),
      fakeCartItem({ id: "ci-2", quantity: 3, unit_price_ht: 500, product: fakeProductRow({ default_price_ht: 500 }) }),
    ];
    const totals = computeCartTotals(items);
    expect(totals.totalItems).toBe(2);
    expect(totals.totalQuantity).toBe(5);
    expect(totals.subtotalHt).toBe(3500);
  });

  it("uses default_price_ht when unit_price_ht is null", () => {
    const items = [
      fakeCartItem({ quantity: 2, unit_price_ht: null, product: fakeProductRow({ default_price_ht: 750 }) }),
    ];
    const totals = computeCartTotals(items);
    expect(totals.subtotalHt).toBe(1500);
  });

  it("handles empty array", () => {
    const totals = computeCartTotals([]);
    expect(totals.totalItems).toBe(0);
    expect(totals.totalQuantity).toBe(0);
    expect(totals.subtotalHt).toBe(0);
  });

  it("ignores items with no price at all", () => {
    const items = [
      fakeCartItem({ quantity: 5, unit_price_ht: null, product: fakeProductRow({ default_price_ht: null }) }),
    ];
    const totals = computeCartTotals(items);
    expect(totals.totalItems).toBe(1);
    expect(totals.totalQuantity).toBe(5);
    expect(totals.subtotalHt).toBe(0);
  });
});
