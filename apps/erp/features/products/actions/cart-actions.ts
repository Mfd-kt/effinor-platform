"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addProductToCart,
  getOrCreateActiveCartForLead,
  removeCartItem,
  updateCartItemQuantity,
} from "@/features/products/domain/repository";
import { toCartViewModel } from "@/features/products/domain/mappers";
import { getCartById } from "@/features/products/domain/repository";
import type { CartViewModel } from "@/features/products/domain/types";
import { notifyProductAddedToCart } from "@/features/notifications/services/notification-service";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export async function ensureCartForLead(
  leadId: string,
  userId: string,
): Promise<ActionResult<CartViewModel>> {
  try {
    const supabase = await createClient();
    const cart = await getOrCreateActiveCartForLead(supabase, leadId, userId);
    return { ok: true, data: toCartViewModel(cart) };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function addToCart(
  cartId: string,
  productId: string,
  quantity: number,
): Promise<ActionResult<CartViewModel>> {
  try {
    const supabase = await createClient();
    await addProductToCart(supabase, cartId, productId, quantity);
    const cart = await getCartById(supabase, cartId);
    if (!cart) return { ok: false, message: "Panier introuvable après ajout." };

    let leadLabel = "Sans lead lié";
    let leadIdForNotify: string | null = cart.lead_id;
    if (cart.lead_id) {
      const { data: leadRow } = await supabase
        .from("leads")
        .select("company_name")
        .eq("id", cart.lead_id)
        .maybeSingle();
      if (leadRow?.company_name?.trim()) {
        leadLabel = leadRow.company_name.trim();
      }
    }
    const addedItem = cart.items.filter((i) => i.product_id === productId).pop();
    const productName = addedItem?.product.name ?? "Produit";
    const qty = addedItem?.quantity ?? quantity;
    void notifyProductAddedToCart({
      productName,
      quantity: qty,
      leadLabel,
      leadId: leadIdForNotify,
      cartSubtotalHt: Number(cart.subtotal_ht ?? 0),
    });

    revalidatePath("/products");
    return { ok: true, data: toCartViewModel(cart) };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function updateItemQuantity(
  cartItemId: string,
  quantity: number,
  cartId: string,
): Promise<ActionResult<CartViewModel>> {
  try {
    const supabase = await createClient();
    await updateCartItemQuantity(supabase, cartItemId, quantity);
    const cart = await getCartById(supabase, cartId);
    if (!cart) return { ok: false, message: "Panier introuvable." };
    revalidatePath("/products");
    return { ok: true, data: toCartViewModel(cart) };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function removeFromCart(
  cartItemId: string,
  cartId: string,
): Promise<ActionResult<CartViewModel>> {
  try {
    const supabase = await createClient();
    await removeCartItem(supabase, cartItemId);
    const cart = await getCartById(supabase, cartId);
    if (!cart) return { ok: false, message: "Panier introuvable." };
    revalidatePath("/products");
    return { ok: true, data: toCartViewModel(cart) };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
