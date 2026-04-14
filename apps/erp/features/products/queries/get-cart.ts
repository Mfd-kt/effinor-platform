import { createClient } from "@/lib/supabase/server";
import {
  getCartById,
  getOrCreateActiveCartForLead,
} from "@/features/products/domain/repository";

export async function queryCartById(cartId: string) {
  const supabase = await createClient();
  return getCartById(supabase, cartId);
}

export async function queryOrCreateCartForLead(leadId: string, userId: string) {
  const supabase = await createClient();
  return getOrCreateActiveCartForLead(supabase, leadId, userId);
}
