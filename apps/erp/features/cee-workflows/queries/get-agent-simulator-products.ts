import { createClient } from "@/lib/supabase/server";
import { allDestratProductCodes } from "@/features/products/domain/recommend";
import { getProductsByCodes } from "@/features/products/domain/repository";
import { toSimulatorProductCardFromDetails } from "@/features/products/domain/mappers";

export async function getAgentDestratSimulatorProducts() {
  const supabase = await createClient();
  const products = await getProductsByCodes(supabase, allDestratProductCodes());
  return products.map(toSimulatorProductCardFromDetails);
}
