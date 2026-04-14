"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PRODUCT_IMAGES_BUCKET = "product-images";

export async function updateProductAction(
  productId: string,
  fields: {
    name?: string;
    brand?: string;
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
