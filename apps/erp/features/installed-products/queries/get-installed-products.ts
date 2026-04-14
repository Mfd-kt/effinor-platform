import { createClient } from "@/lib/supabase/server";

import type { InstalledProductListRow, InstalledProductRow } from "@/features/installed-products/types";

export type InstalledProductListFilters = {
  q?: string;
  product_id?: string;
  cee_sheet_code?: string;
};

type RawRow = InstalledProductRow & {
  products: { brand: string; reference: string; name: string } | null;
};

function productLabel(p: RawRow["products"]): string | null {
  if (!p) return null;
  return `${p.brand} · ${p.reference} — ${p.name}`;
}

function normalize(raw: RawRow): InstalledProductListRow {
  const { products, ...rest } = raw;
  return {
    ...rest,
    product_label: productLabel(products),
  };
}

export async function getInstalledProducts(
  filters?: InstalledProductListFilters,
): Promise<InstalledProductListRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("installed_products")
    .select(
      `
      *,
      products ( brand, reference, name )
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.product_id?.trim()) {
    query = query.eq("product_id", filters.product_id.trim());
  }

  if (filters?.cee_sheet_code?.trim()) {
    const t = `%${filters.cee_sheet_code.trim()}%`;
    query = query.ilike("cee_sheet_code", t);
  }

  if (filters?.q?.trim()) {
    const raw = filters.q.trim().replace(/,/g, " ");
    const term = `%${raw}%`;
    query = query.or(`notes.ilike.${term},cee_sheet_code.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible de charger les produits installés : ${error.message}`);
  }

  return (data as unknown as RawRow[] | null)?.map(normalize) ?? [];
}
