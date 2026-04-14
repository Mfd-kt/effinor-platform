import { createClient } from "@/lib/supabase/server";

import type { InstalledProductFormOptions } from "@/features/installed-products/types";

/**
 * Catalogue produits pour les formulaires.
 */
export async function getInstalledProductFormOptions(): Promise<InstalledProductFormOptions> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, brand, reference, name")
    .is("deleted_at", null)
    .order("brand", { ascending: true })
    .order("reference", { ascending: true })
    .limit(5000);

  if (error) {
    throw new Error(`Produits : ${error.message}`);
  }

  const products = (data ?? []).map((r) => ({
    id: r.id,
    brand: r.brand,
    reference: r.reference,
    name: r.name,
  }));

  return { products };
}
