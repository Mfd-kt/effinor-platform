import { createClient } from "@/lib/supabase/server";
import {
  getProductByCode,
  getProductsByCodes,
  getProductsForCatalog,
  getProductsForPdf,
  getProductsForSimulatorCards,
  listActiveProducts,
} from "@/features/products/domain/repository";
import type { ListProductsParams } from "@/features/products/domain/types";

export async function queryProductByCode(code: string) {
  const supabase = await createClient();
  return getProductByCode(supabase, code);
}

export async function queryProductsByCodes(codes: string[]) {
  const supabase = await createClient();
  return getProductsByCodes(supabase, codes);
}

export async function queryActiveProducts(params?: ListProductsParams) {
  const supabase = await createClient();
  return listActiveProducts(supabase, params);
}

export async function queryProductsForCatalog() {
  const supabase = await createClient();
  return getProductsForCatalog(supabase);
}

export async function queryProductsForSimulatorCards(codes?: string[]) {
  const supabase = await createClient();
  return getProductsForSimulatorCards(supabase, codes);
}

export async function queryProductsForPdf(codes: string[]) {
  const supabase = await createClient();
  return getProductsForPdf(supabase, codes);
}
