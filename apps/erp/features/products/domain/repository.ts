import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { computeCartTotals, computeLineTotalHt } from "./cart-calculations";
import type {
  CartItemRow,
  CartRow,
  CartWithItems,
  ListProductsParams,
  ProductRow,
  ProductWithDetails,
} from "./types";

type Supabase = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Product reading
// ---------------------------------------------------------------------------

async function fetchSpecsForProduct(supabase: Supabase, productId: string) {
  const { data } = await supabase
    .from("product_specs")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order");
  return data ?? [];
}

async function fetchMetricsForProduct(supabase: Supabase, productId: string) {
  const { data } = await supabase
    .from("product_key_metrics")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order");
  return data ?? [];
}

async function enrichWithDetails(
  supabase: Supabase,
  product: ProductRow,
): Promise<ProductWithDetails> {
  const [specs, keyMetrics] = await Promise.all([
    fetchSpecsForProduct(supabase, product.id),
    fetchMetricsForProduct(supabase, product.id),
  ]);
  return { ...product, specs, keyMetrics };
}

async function enrichManyWithDetails(
  supabase: Supabase,
  products: ProductRow[],
): Promise<ProductWithDetails[]> {
  if (products.length === 0) return [];
  const ids = products.map((p) => p.id);

  const [{ data: allSpecs }, { data: allMetrics }] = await Promise.all([
    supabase
      .from("product_specs")
      .select("*")
      .in("product_id", ids)
      .order("sort_order"),
    supabase
      .from("product_key_metrics")
      .select("*")
      .in("product_id", ids)
      .order("sort_order"),
  ]);

  const specsMap = new Map<string, typeof allSpecs>();
  for (const s of allSpecs ?? []) {
    const arr = specsMap.get(s.product_id) ?? [];
    arr.push(s);
    specsMap.set(s.product_id, arr);
  }
  const metricsMap = new Map<string, typeof allMetrics>();
  for (const m of allMetrics ?? []) {
    const arr = metricsMap.get(m.product_id) ?? [];
    arr.push(m);
    metricsMap.set(m.product_id, arr);
  }

  return products.map((p) => ({
    ...p,
    specs: specsMap.get(p.id) ?? [],
    keyMetrics: metricsMap.get(p.id) ?? [],
  }));
}

// ---------------------------------------------------------------------------
// Product repository
// ---------------------------------------------------------------------------

export async function getProductByCode(
  supabase: Supabase,
  code: string,
): Promise<ProductWithDetails | null> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("product_code", code)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  return enrichWithDetails(supabase, data);
}

export async function getProductsByCodes(
  supabase: Supabase,
  codes: string[],
): Promise<ProductWithDetails[]> {
  if (codes.length === 0) return [];
  const { data } = await supabase
    .from("products")
    .select("*")
    .in("product_code", codes)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order");
  return enrichManyWithDetails(supabase, data ?? []);
}

export async function listActiveProducts(
  supabase: Supabase,
  params?: ListProductsParams,
): Promise<ProductRow[]> {
  let query = supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order");

  if (params?.activeOnly !== false) {
    query = query.eq("is_active", true);
  }
  if (params?.category) {
    query = query.eq("category", params.category);
  }
  if (params?.family) {
    query = query.eq("product_family", params.family as never);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getProductWithDetailsByCode(
  supabase: Supabase,
  code: string,
): Promise<ProductWithDetails | null> {
  return getProductByCode(supabase, code);
}

export async function getProductsForCatalog(
  supabase: Supabase,
): Promise<ProductWithDetails[]> {
  const products = await listActiveProducts(supabase);
  return enrichManyWithDetails(supabase, products);
}

export async function getProductsForSimulatorCards(
  supabase: Supabase,
  codes?: string[],
): Promise<ProductWithDetails[]> {
  if (codes && codes.length > 0) return getProductsByCodes(supabase, codes);
  return getProductsForCatalog(supabase);
}

export async function getProductsForPdf(
  supabase: Supabase,
  codes: string[],
): Promise<ProductWithDetails[]> {
  return getProductsByCodes(supabase, codes);
}

// ---------------------------------------------------------------------------
// Cart repository
// ---------------------------------------------------------------------------

async function loadCartItems(
  supabase: Supabase,
  cartId: string,
): Promise<(CartItemRow & { product: ProductRow })[]> {
  const { data } = await supabase
    .from("project_cart_items")
    .select("*, product:products(*)")
    .eq("cart_id", cartId)
    .order("display_order");

  return (data ?? []).map((row) => ({
    ...row,
    product: row.product as unknown as ProductRow,
  }));
}

export async function getCartById(
  supabase: Supabase,
  cartId: string,
): Promise<CartWithItems | null> {
  const { data: cart } = await supabase
    .from("project_carts")
    .select("*")
    .eq("id", cartId)
    .maybeSingle();
  if (!cart) return null;
  const items = await loadCartItems(supabase, cart.id);
  return { ...cart, items };
}

export async function getOrCreateActiveCartForLead(
  supabase: Supabase,
  leadId: string,
  userId: string,
): Promise<CartWithItems> {
  const { data: leadRow } = await supabase
    .from("leads")
    .select("current_workflow_id")
    .eq("id", leadId)
    .maybeSingle();
  const workflowId = leadRow?.current_workflow_id ?? null;

  let existingQuery = supabase
    .from("project_carts")
    .select("*")
    .eq("lead_id", leadId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  existingQuery = workflowId
    ? existingQuery.eq("workflow_id", workflowId)
    : existingQuery.is("workflow_id", null);

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const items = await loadCartItems(supabase, existing.id);
    return { ...existing, items };
  }

  const { data: created, error } = await supabase
    .from("project_carts")
    .insert({
      lead_id: leadId,
      workflow_id: workflowId,
      created_by_user_id: userId,
      owner_user_id: userId,
    })
    .select()
    .single();

  if (error || !created) {
    throw new Error(`Failed to create cart for lead ${leadId}: ${error?.message}`);
  }
  return { ...created, items: [] };
}

export async function addProductToCart(
  supabase: Supabase,
  cartId: string,
  productId: string,
  quantity: number,
): Promise<CartItemRow> {
  const { data: product } = await supabase
    .from("products")
    .select("default_price_ht")
    .eq("id", productId)
    .single();

  const unitPriceHt = product?.default_price_ht ?? null;
  const lineTotalHt = computeLineTotalHt(quantity, unitPriceHt);

  const { data, error } = await supabase
    .from("project_cart_items")
    .insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
      unit_price_ht: unitPriceHt,
      line_total_ht: lineTotalHt,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to add product to cart: ${error?.message}`);
  }

  await recomputeCartTotals(supabase, cartId);
  return data;
}

export async function updateCartItemQuantity(
  supabase: Supabase,
  cartItemId: string,
  quantity: number,
): Promise<CartItemRow> {
  const { data: existing } = await supabase
    .from("project_cart_items")
    .select("*, product:products(default_price_ht)")
    .eq("id", cartItemId)
    .single();

  if (!existing) throw new Error(`Cart item ${cartItemId} not found`);

  const unitPriceHt =
    existing.unit_price_ht ??
    (existing.product as unknown as { default_price_ht: number | null })?.default_price_ht ??
    null;
  const lineTotalHt = computeLineTotalHt(quantity, unitPriceHt);

  const { data, error } = await supabase
    .from("project_cart_items")
    .update({ quantity, unit_price_ht: unitPriceHt, line_total_ht: lineTotalHt })
    .eq("id", cartItemId)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to update cart item: ${error?.message}`);

  await recomputeCartTotals(supabase, existing.cart_id);
  return data;
}

export async function removeCartItem(
  supabase: Supabase,
  cartItemId: string,
): Promise<void> {
  const { data: item } = await supabase
    .from("project_cart_items")
    .select("cart_id")
    .eq("id", cartItemId)
    .single();

  await supabase.from("project_cart_items").delete().eq("id", cartItemId);

  if (item) {
    await recomputeCartTotals(supabase, item.cart_id);
  }
}

export async function recomputeCartTotals(
  supabase: Supabase,
  cartId: string,
): Promise<CartRow> {
  const items = await loadCartItems(supabase, cartId);
  const totals = computeCartTotals(items);

  const { data, error } = await supabase
    .from("project_carts")
    .update({
      total_items: totals.totalItems,
      total_quantity: totals.totalQuantity,
      subtotal_ht: totals.subtotalHt,
    })
    .eq("id", cartId)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to update cart totals: ${error?.message}`);
  return data;
}
