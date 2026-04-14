"use server";

import { revalidatePath } from "next/cache";

import { insertFromInstalledProductForm } from "@/features/installed-products/lib/map-to-db";
import { InstalledProductInsertSchema } from "@/features/installed-products/schemas/installed-product.schema";
import type { InstalledProductRow } from "@/features/installed-products/types";
import { createClient } from "@/lib/supabase/server";

export type CreateInstalledProductResult =
  | { ok: true; data: InstalledProductRow }
  | { ok: false; message: string };

export async function createInstalledProduct(input: unknown): Promise<CreateInstalledProductResult> {
  const parsed = InstalledProductInsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }

  const row = insertFromInstalledProductForm(parsed.data);
  const supabase = await createClient();

  const { data, error } = await supabase.from("installed_products").insert(row).select().single();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Aucune donnée retournée après création." };
  }

  revalidatePath("/installed-products");
  return { ok: true, data };
}
