"use server";

import { revalidatePath } from "next/cache";

import { getAccessContext } from "@/lib/auth/access-context";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

const PRODUCT_IMAGES_BUCKET = "product-images";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

function normalizeProductCode(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s;
}

export async function createProductAction(fields: {
  name: string;
  brand: string;
  product_code: string;
  reference?: string;
  category?: string;
  product_family?: ProductInsert["product_family"];
  default_price_ht?: number | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès réservé au super administrateur." };
  }

  const code = normalizeProductCode(fields.product_code);
  if (!code) {
    return { ok: false, error: "Indiquez un code produit (lettres, chiffres, tirets ou underscores)." };
  }

  const name = fields.name.trim();
  const brand = fields.brand.trim();
  if (!name || !brand) {
    return { ok: false, error: "Le nom et la marque sont obligatoires." };
  }

  const reference = (fields.reference?.trim() || code).trim();

  const family = fields.product_family ?? null;
  const categoryTrim = fields.category?.trim();
  const category =
    categoryTrim || (family === "heat_pump" ? "pac" : "destratificateur");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      brand,
      product_code: code,
      reference,
      category,
      product_family: family,
      default_price_ht: fields.default_price_ht ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error:
          "Ce code produit existe déjà, ou la combinaison marque + référence est déjà utilisée.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings/products");
  revalidatePath("/products");
  return { ok: true, id: data.id };
}

export async function updateProductAction(
  productId: string,
  fields: {
    name?: string;
    brand?: string;
    category?: string;
    product_family?: ProductInsert["product_family"] | null;
    description_short?: string;
    description_long?: string;
    image_url?: string | null;
    default_price_ht?: number | null;
    is_active?: boolean;
    sort_order?: number;
  },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/products");
  revalidatePath(`/settings/products/${productId}`);
  return { ok: true };
}

export async function updateProductSpecAction(
  productId: string,
  specId: string,
  fields: {
    spec_label?: string;
    spec_value?: string;
    spec_group?: string | null;
 },
): Promise<{ ok: boolean; error?: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès réservé au super administrateur." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("product_specs")
    .select("id, product_id")
    .eq("id", specId)
    .maybeSingle();

  if (fetchErr || !row || row.product_id !== productId) {
    return { ok: false, error: "Caractéristique introuvable." };
  }

  const { error } = await supabase.from("product_specs").update(fields).eq("id", specId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/settings/products/${productId}`);
  return { ok: true };
}

export async function updateProductKeyMetricAction(
  productId: string,
  metricId: string,
  fields: { label?: string },
): Promise<{ ok: boolean; error?: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    return { ok: false, error: "Accès réservé au super administrateur." };
  }

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("product_key_metrics")
    .select("id, product_id")
    .eq("id", metricId)
    .maybeSingle();

  if (fetchErr || !row || row.product_id !== productId) {
    return { ok: false, error: "Repère introuvable." };
  }

  const { error } = await supabase.from("product_key_metrics").update(fields).eq("id", metricId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/settings/products/${productId}`);
  return { ok: true };
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const productId = formData.get("productId");
  const file = formData.get("file");
  if (typeof productId !== "string" || !productId) return { error: "Produit invalide." };
  if (!(file instanceof File)) return { error: "Aucun fichier." };

  if (file.size > 10 * 1024 * 1024) return { error: "Fichier trop volumineux (max 10 Mo)." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const objectPath = `${productId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, file, { cacheControl: "3600", upsert: false });

  if (uploadErr) return { error: uploadErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);

  const isCoverRaw = formData.get("isCover");
  const isCover = isCoverRaw === "true";

  if (isCover) {
    await supabase
      .from("product_images")
      .update({ is_cover: false })
      .eq("product_id", productId);
  }

  const { data: maxOrder } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.sort_order ?? 0) + 10;

  const { error: dbErr } = await supabase.from("product_images").insert({
    product_id: productId,
    url: publicUrl,
    alt: file.name,
    is_cover: isCover,
    sort_order: nextOrder,
  });

  if (dbErr) return { error: dbErr.message };

  if (isCover) {
    await supabase
      .from("products")
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", productId);
  }

  revalidatePath(`/settings/products/${productId}`);
  return { url: publicUrl };
}

export async function deleteProductImageAction(
  imageId: string,
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: img } = await supabase
    .from("product_images")
    .select("url, is_cover")
    .eq("id", imageId)
    .single();

  if (!img) return { ok: true };

  try {
    const urlObj = new URL(img.url);
    const pathParts = urlObj.pathname.split(`/${PRODUCT_IMAGES_BUCKET}/`);
    if (pathParts[1]) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([pathParts[1]]);
    }
  } catch {
    // URL parsing failure — skip storage cleanup
  }

  await supabase.from("product_images").delete().eq("id", imageId);

  if (img.is_cover) {
    const { data: next } = await supabase
      .from("product_images")
      .select("url")
      .eq("product_id", productId)
      .order("sort_order")
      .limit(1)
      .maybeSingle();

    await supabase
      .from("products")
      .update({
        image_url: next?.url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);
  }

  revalidatePath(`/settings/products/${productId}`);
  return { ok: true };
}

export async function setProductCoverImageAction(
  imageId: string,
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  await supabase
    .from("product_images")
    .update({ is_cover: false })
    .eq("product_id", productId);

  await supabase
    .from("product_images")
    .update({ is_cover: true })
    .eq("id", imageId);

  const { data: img } = await supabase
    .from("product_images")
    .select("url")
    .eq("id", imageId)
    .single();

  if (img) {
    await supabase
      .from("products")
      .update({ image_url: img.url, updated_at: new Date().toISOString() })
      .eq("id", productId);
  }

  revalidatePath(`/settings/products/${productId}`);
  return { ok: true };
}
