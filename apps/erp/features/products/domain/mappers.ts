import type {
  CartItemRow,
  CartItemViewModel,
  CartRow,
  CartViewModel,
  CartWithItems,
  DimensioningProductViewModel,
  PdfStudyProductViewModel,
  ProductCatalogCardViewModel,
  ProductRow,
  ProductSpecRow,
  ProductKeyMetricRow,
  ProductWithDetails,
  QuoteProductLineViewModel,
  SimulatorProductCardViewModel,
} from "./types";

// ---------------------------------------------------------------------------
// Image resolution
// ---------------------------------------------------------------------------

export function resolveProductImageUrl(product: ProductRow): string | null {
  return product.image_url ?? product.fallback_image_url ?? null;
}

// ---------------------------------------------------------------------------
// Catalog card (e-commerce internal)
// ---------------------------------------------------------------------------

export function toProductCatalogCard(
  product: ProductRow,
  keyMetrics: ProductKeyMetricRow[],
): ProductCatalogCardViewModel {
  return {
    id: product.id,
    code: product.product_code,
    name: product.name,
    shortLabel: product.short_label,
    brand: product.brand,
    imageUrl: resolveProductImageUrl(product),
    descriptionShort: product.description_short,
    keyMetrics: keyMetrics.map((m) => m.label),
    defaultPriceHt: product.default_price_ht,
    isActive: product.is_active,
    category: product.category,
  };
}

export function toProductCatalogCardFromDetails(
  p: ProductWithDetails,
): ProductCatalogCardViewModel {
  return toProductCatalogCard(p, p.keyMetrics);
}

// ---------------------------------------------------------------------------
// Simulator card
// ---------------------------------------------------------------------------

export function toSimulatorProductCard(
  product: ProductRow,
  specs: ProductSpecRow[],
  keyMetrics: ProductKeyMetricRow[],
): SimulatorProductCardViewModel {
  return {
    id: product.id,
    code: product.product_code,
    name: product.name,
    imageUrl: resolveProductImageUrl(product),
    descriptionShort: product.description_short,
    topSpecs: specs
      .slice(0, 3)
      .map((s) => ({ label: s.spec_label, value: s.spec_value })),
    keyMetrics: keyMetrics.map((m) => m.label),
  };
}

export function toSimulatorProductCardFromDetails(
  p: ProductWithDetails,
): SimulatorProductCardViewModel {
  return toSimulatorProductCard(p, p.specs, p.keyMetrics);
}

// ---------------------------------------------------------------------------
// PDF study
// ---------------------------------------------------------------------------

const DEFAULT_RATIONALE =
  "Modèle retenu au regard de la hauteur, du volume traité et des hypothèses de brassage considérées au stade préliminaire.";

export function toPdfStudyProduct(
  product: ProductRow,
  specs: ProductSpecRow[],
  keyMetrics: ProductKeyMetricRow[],
  rationaleText?: string,
): PdfStudyProductViewModel {
  return {
    id: product.id,
    displayName: product.name,
    description: product.description_short ?? product.description ?? "",
    imageUrlResolved: resolveProductImageUrl(product),
    galleryUrls: [],
    specsForDisplay: specs
      .slice(0, 6)
      .map((s) => ({ label: s.spec_label, value: s.spec_value })),
    keyMetricsForDisplay: keyMetrics
      .slice(0, 3)
      .map((m) => ({ label: "Repère", value: m.label })),
    rationaleText: rationaleText ?? DEFAULT_RATIONALE,
  };
}

export function toPdfStudyProductFromDetails(
  p: ProductWithDetails,
  rationaleText?: string,
): PdfStudyProductViewModel {
  return toPdfStudyProduct(p, p.specs, p.keyMetrics, rationaleText);
}

// ---------------------------------------------------------------------------
// Quote line
// ---------------------------------------------------------------------------

export function toQuoteProductLine(
  product: ProductRow,
  specs: ProductSpecRow[],
  quantity: number,
  unitPriceHt: number | null,
): QuoteProductLineViewModel {
  const effectivePrice = unitPriceHt ?? product.default_price_ht;
  const topSpecs = specs
    .slice(0, 3)
    .map((s) => `${s.spec_label}: ${s.spec_value}`)
    .join(" · ");
  return {
    displayName: product.name,
    unitLabel: product.unit_label,
    quantity,
    unitPriceHt: effectivePrice,
    lineTotalHt:
      effectivePrice != null ? Math.round(effectivePrice * quantity * 100) / 100 : null,
    shortTechnicalSummary: topSpecs,
  };
}

// ---------------------------------------------------------------------------
// Dimensioning
// ---------------------------------------------------------------------------

const PERFORMANCE_SPEC_KEYS = new Set(["airflow", "throw", "power"]);

export function toDimensioningProduct(
  product: ProductRow,
  specs: ProductSpecRow[],
  rationaleText?: string,
): DimensioningProductViewModel {
  const technical = specs
    .filter((s) => !PERFORMANCE_SPEC_KEYS.has(s.spec_key))
    .map((s) => ({ label: s.spec_label, value: s.spec_value }));
  const performance = specs
    .filter((s) => PERFORMANCE_SPEC_KEYS.has(s.spec_key))
    .map((s) => ({ label: s.spec_label, value: s.spec_value }));
  return {
    displayName: product.name,
    technicalSpecs: technical,
    performanceSpecs: performance,
    rationaleText: rationaleText ?? DEFAULT_RATIONALE,
  };
}

export function toDimensioningProductFromDetails(
  p: ProductWithDetails,
  rationaleText?: string,
): DimensioningProductViewModel {
  return toDimensioningProduct(p, p.specs, rationaleText);
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export function toCartItemViewModel(
  item: CartItemRow & { product: ProductRow },
): CartItemViewModel {
  return {
    id: item.id,
    productId: item.product_id,
    productName: item.product.name,
    productCode: item.product.product_code,
    imageUrl: resolveProductImageUrl(item.product),
    quantity: item.quantity,
    unitPriceHt: item.unit_price_ht,
    lineTotalHt: item.line_total_ht,
    displayOrder: item.display_order,
  };
}

export function toCartViewModel(cart: CartWithItems): CartViewModel {
  return {
    id: cart.id,
    leadId: cart.lead_id,
    workflowId: cart.workflow_id,
    status: cart.status,
    currency: cart.currency,
    totalItems: cart.total_items,
    totalQuantity: cart.total_quantity,
    subtotalHt: cart.subtotal_ht,
    items: cart.items
      .sort(
        (a: CartWithItems["items"][number], b: CartWithItems["items"][number]) =>
          a.display_order - b.display_order,
      )
      .map(toCartItemViewModel),
  };
}
