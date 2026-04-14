import { createClient } from "@/lib/supabase/server";

import type { InstalledProductDetailRow } from "@/features/installed-products/types";

export async function getInstalledProductById(id: string): Promise<InstalledProductDetailRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("installed_products")
    .select(
      `
      *,
      products ( id, brand, reference, name )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger le produit installé : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return data as unknown as InstalledProductDetailRow;
}
