import type { Database, Json } from "@/types/database.types";

// ---------------------------------------------------------------------------
// DB row types
// ---------------------------------------------------------------------------

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductSpecRow = Database["public"]["Tables"]["product_specs"]["Row"];
export type ProductKeyMetricRow = Database["public"]["Tables"]["product_key_metrics"]["Row"];
export type CartRow = Database["public"]["Tables"]["project_carts"]["Row"];
export type CartInsert = Database["public"]["Tables"]["project_carts"]["Insert"];
export type CartItemRow = Database["public"]["Tables"]["project_cart_items"]["Row"];
export type CartItemInsert = Database["public"]["Tables"]["project_cart_items"]["Insert"];

// ---------------------------------------------------------------------------
// Domain aggregates
// ---------------------------------------------------------------------------

export type ProductWithDetails = ProductRow & {
  specs: ProductSpecRow[];
  keyMetrics: ProductKeyMetricRow[];
};

export type CartWithItems = CartRow & {
  items: (CartItemRow & { product: ProductRow })[];
};

// ---------------------------------------------------------------------------
// View models — one per rendering context
// ---------------------------------------------------------------------------

export type ProductCatalogCardViewModel = {
  id: string;
  code: string;
  name: string;
  shortLabel: string | null;
  brand: string;
  imageUrl: string | null;
  descriptionShort: string | null;
  keyMetrics: string[];
  defaultPriceHt: number | null;
  isActive: boolean;
  category: string;
};

export type SimulatorProductCardViewModel = {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  descriptionShort: string | null;
  topSpecs: { label: string; value: string }[];
  keyMetrics: string[];
};

export type PdfStudyProductViewModel = {
  id: string;
  displayName: string;
  description: string;
  imageUrlResolved: string | null;
  galleryUrls: string[];
  specsForDisplay: { label: string; value: string }[];
  keyMetricsForDisplay: { label: string; value: string }[];
  rationaleText: string;
};

export type QuoteProductLineViewModel = {
  displayName: string;
  unitLabel: string;
  quantity: number;
  unitPriceHt: number | null;
  lineTotalHt: number | null;
  shortTechnicalSummary: string;
};

export type DimensioningProductViewModel = {
  displayName: string;
  technicalSpecs: { label: string; value: string }[];
  performanceSpecs: { label: string; value: string }[];
  rationaleText: string;
};

// ---------------------------------------------------------------------------
// Cart view model
// ---------------------------------------------------------------------------

export type CartItemViewModel = {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceHt: number | null;
  lineTotalHt: number | null;
  displayOrder: number;
};

export type CartViewModel = {
  id: string;
  leadId: string | null;
  workflowId: string | null;
  status: string;
  currency: string;
  totalItems: number;
  totalQuantity: number;
  subtotalHt: number;
  items: CartItemViewModel[];
};

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

export type ListProductsParams = {
  category?: string;
  family?: string;
  activeOnly?: boolean;
};

export interface ProductRepository {
  getProductByCode(code: string): Promise<ProductWithDetails | null>;
  getProductsByCodes(codes: string[]): Promise<ProductWithDetails[]>;
  listActiveProducts(params?: ListProductsParams): Promise<ProductRow[]>;
  getProductWithDetailsByCode(code: string): Promise<ProductWithDetails | null>;
  getProductsForCatalog(): Promise<ProductWithDetails[]>;
}

export interface CartRepository {
  getOrCreateActiveCartForLead(leadId: string, userId: string): Promise<CartWithItems>;
  getCartById(cartId: string): Promise<CartWithItems | null>;
  addProductToCart(cartId: string, productId: string, quantity: number): Promise<CartItemRow>;
  updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartItemRow>;
  removeCartItem(cartItemId: string): Promise<void>;
  recomputeCartTotals(cartId: string): Promise<CartRow>;
}
