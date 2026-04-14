import { createClient } from "@/lib/supabase/server";
import type { ProductWithDetails } from "@/features/products/domain/types";
import type { Database } from "@/types/database.types";

export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];

export type AdminProductRow = Database["public"]["Tables"]["products"]["Row"] & {
  specs: Database["public"]["Tables"]["product_specs"]["Row"][];
  keyMetrics: Database["public"]["Tables"]["product_key_metrics"]["Row"][];
  images: ProductImageRow[];
};

export async function queryAllProductsForAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function queryProductByIdForAdmin(
  productId: string,
): Promise<AdminProductRow | null> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!product) return null;

  const [{ data: specs }, { data: metrics }, { data: images }] = await Promise.all([
    supabase
      .from("product_specs")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("product_key_metrics")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order"),
  ]);

  return {
    ...product,
    specs: specs ?? [],
    keyMetrics: metrics ?? [],
    images: images ?? [],
  };
}
