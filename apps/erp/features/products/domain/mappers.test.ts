import { describe, expect, it } from "vitest";

import {
  resolveProductImageUrl,
  toProductCatalogCard,
  toSimulatorProductCard,
  toPdfStudyProduct,
  toQuoteProductLine,
  toDimensioningProduct,
  toCartItemViewModel,
  toCartViewModel,
} from "./mappers";
import type {
  CartItemRow,
  CartWithItems,
  ProductKeyMetricRow,
  ProductRow,
  ProductSpecRow,
} from "./types";

function fakeProduct(overrides?: Partial<ProductRow>): ProductRow {
  return {
    id: "p-1",
    brand: "Teddington",
    reference: "ONSEN-DS3",
    product_code: "teddington_ds3",
    name: "Teddington ONSEN DS3",
    short_label: "ONSEN DS3",
    category: "destratificateur",
    description: "Full description",
    description_short: "Short description",
    description_long: "Long description",
    image_url: "https://example.com/img.jpg",
    fallback_image_url: "https://example.com/fb.jpg",
    noise_db: 39,
    airflow_m3h: 2330,
    max_throw: 7,
    unit_power_w: 68,
    luminous_efficiency: null,
    cri: null,
    unit_price_ht: 1250,
    default_price_ht: 1250,
    valuation: null,
    product_family: "destratification",
    is_active: true,
    sort_order: 10,
    usage_contexts: ["simulator", "study_pdf"],
    unit_label: "unité",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    ...overrides,
  } as ProductRow;
}

function fakeSpecs(): ProductSpecRow[] {
  return [
    { id: "s1", product_id: "p-1", spec_key: "airflow", spec_label: "Débit d'air", spec_value: "2 330 m³/h", spec_group: "performance", sort_order: 10, created_at: "" },
    { id: "s2", product_id: "p-1", spec_key: "throw", spec_label: "Portée verticale", spec_value: "7 m", spec_group: "performance", sort_order: 20, created_at: "" },
    { id: "s3", product_id: "p-1", spec_key: "power", spec_label: "Consommation max", spec_value: "68 W", spec_group: "electrical", sort_order: 30, created_at: "" },
  ];
}

function fakeMetrics(): ProductKeyMetricRow[] {
  return [
    { id: "m1", product_id: "p-1", label: "Format compact", sort_order: 10, created_at: "" },
    { id: "m2", product_id: "p-1", label: "Faible consommation", sort_order: 20, created_at: "" },
  ];
}

// ---------------------------------------------------------------------------
// resolveProductImageUrl
// ---------------------------------------------------------------------------

describe("resolveProductImageUrl", () => {
  it("returns image_url when available", () => {
    expect(resolveProductImageUrl(fakeProduct())).toBe("https://example.com/img.jpg");
  });

  it("falls back to fallback_image_url", () => {
    expect(resolveProductImageUrl(fakeProduct({ image_url: null }))).toBe("https://example.com/fb.jpg");
  });

  it("returns null when both are missing", () => {
    expect(resolveProductImageUrl(fakeProduct({ image_url: null, fallback_image_url: null }))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toProductCatalogCard
// ---------------------------------------------------------------------------

describe("toProductCatalogCard", () => {
  it("maps fields correctly", () => {
    const card = toProductCatalogCard(fakeProduct(), fakeMetrics());
    expect(card.id).toBe("p-1");
    expect(card.code).toBe("teddington_ds3");
    expect(card.name).toBe("Teddington ONSEN DS3");
    expect(card.keyMetrics).toEqual(["Format compact", "Faible consommation"]);
    expect(card.defaultPriceHt).toBe(1250);
  });
});

// ---------------------------------------------------------------------------
// toSimulatorProductCard
// ---------------------------------------------------------------------------

describe("toSimulatorProductCard", () => {
  it("limits topSpecs to 3", () => {
    const card = toSimulatorProductCard(fakeProduct(), fakeSpecs(), fakeMetrics());
    expect(card.topSpecs).toHaveLength(3);
    expect(card.topSpecs[0].label).toBe("Débit d'air");
  });
});

// ---------------------------------------------------------------------------
// toPdfStudyProduct
// ---------------------------------------------------------------------------

describe("toPdfStudyProduct", () => {
  it("uses description_short", () => {
    const vm = toPdfStudyProduct(fakeProduct(), fakeSpecs(), fakeMetrics());
    expect(vm.description).toBe("Short description");
  });

  it("defaults rationale text", () => {
    const vm = toPdfStudyProduct(fakeProduct(), fakeSpecs(), fakeMetrics());
    expect(vm.rationaleText).toContain("Modèle retenu");
  });

  it("uses custom rationale when provided", () => {
    const vm = toPdfStudyProduct(fakeProduct(), fakeSpecs(), fakeMetrics(), "Custom rationale");
    expect(vm.rationaleText).toBe("Custom rationale");
  });
});

// ---------------------------------------------------------------------------
// toQuoteProductLine
// ---------------------------------------------------------------------------

describe("toQuoteProductLine", () => {
  it("computes line total", () => {
    const line = toQuoteProductLine(fakeProduct(), fakeSpecs(), 3, 1250);
    expect(line.lineTotalHt).toBe(3750);
    expect(line.unitLabel).toBe("unité");
  });

  it("falls back to default_price_ht", () => {
    const line = toQuoteProductLine(fakeProduct(), fakeSpecs(), 2, null);
    expect(line.unitPriceHt).toBe(1250);
    expect(line.lineTotalHt).toBe(2500);
  });

  it("handles null prices", () => {
    const line = toQuoteProductLine(fakeProduct({ default_price_ht: null }), fakeSpecs(), 2, null);
    expect(line.unitPriceHt).toBeNull();
    expect(line.lineTotalHt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toDimensioningProduct
// ---------------------------------------------------------------------------

describe("toDimensioningProduct", () => {
  it("separates performance and technical specs", () => {
    const vm = toDimensioningProduct(fakeProduct(), fakeSpecs());
    expect(vm.performanceSpecs.map((s) => s.label)).toContain("Débit d'air");
    expect(vm.performanceSpecs.map((s) => s.label)).toContain("Consommation max");
  });
});

// ---------------------------------------------------------------------------
// toCartItemViewModel + toCartViewModel
// ---------------------------------------------------------------------------

describe("toCartItemViewModel", () => {
  it("maps cart item with product", () => {
    const item: CartItemRow & { product: ProductRow } = {
      id: "ci-1",
      cart_id: "c-1",
      product_id: "p-1",
      quantity: 3,
      unit_price_ht: 1250,
      line_total_ht: 3750,
      display_order: 100,
      metadata: {},
      created_at: "",
      updated_at: "",
      product: fakeProduct(),
    };
    const vm = toCartItemViewModel(item);
    expect(vm.productName).toBe("Teddington ONSEN DS3");
    expect(vm.quantity).toBe(3);
    expect(vm.lineTotalHt).toBe(3750);
  });
});

describe("toCartViewModel", () => {
  it("maps a full cart with items", () => {
    const cart: CartWithItems = {
      id: "c-1",
      cart_code: null,
      lead_id: "lead-1",
      workflow_id: null,
      simulation_id: null,
      created_by_user_id: "u-1",
      owner_user_id: "u-1",
      status: "active",
      currency: "EUR",
      total_items: 1,
      total_quantity: 3,
      subtotal_ht: 3750,
      metadata: {},
      created_at: "",
      updated_at: "",
      items: [
        {
          id: "ci-1",
          cart_id: "c-1",
          product_id: "p-1",
          quantity: 3,
          unit_price_ht: 1250,
          line_total_ht: 3750,
          display_order: 100,
          metadata: {},
          created_at: "",
          updated_at: "",
          product: fakeProduct(),
        },
      ],
    };
    const vm = toCartViewModel(cart);
    expect(vm.id).toBe("c-1");
    expect(vm.items).toHaveLength(1);
    expect(vm.subtotalHt).toBe(3750);
  });
});
