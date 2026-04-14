"use server";

import { revalidatePath } from "next/cache";

import { insertFromInstalledProductForm } from "@/features/installed-products/lib/map-to-db";
import { InstalledProductUpdatePayloadSchema } from "@/features/installed-products/schemas/installed-product.schema";
import type { InstalledProductRow } from "@/features/installed-products/types";
import { createClient } from "@/lib/supabase/server";

export type UpdateInstalledProductResult =
  | { ok: true; data: InstalledProductRow }
  | { ok: false; message: string };

export async function updateInstalledProduct(input: unknown): Promise<UpdateInstalledProductResult> {
  const parsed = InstalledProductUpdatePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const { id, ...rest } = parsed.data;

  const row = insertFromInstalledProductForm(rest);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("installed_products")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après mise à jour." };
  }

  revalidatePath("/installed-products");
  revalidatePath(`/installed-products/${id}`);
  return { ok: true, data };
}
