"use server";

import type { LeadGenerationActionResult } from "../lib/action-result";
import type { LeadGenerationStockListItem } from "../queries/get-lead-generation-stock";
import { getLeadGenerationStock } from "../queries/get-lead-generation-stock";
import type { GetLeadGenerationStockParams } from "../queries/get-lead-generation-stock";
import { getLeadGenerationStockActionInputSchema } from "../schemas/lead-generation-actions.schema";

export async function getLeadGenerationStockAction(
  params?: unknown,
): Promise<LeadGenerationActionResult<LeadGenerationStockListItem[]>> {
  const parsed = getLeadGenerationStockActionInputSchema.safeParse(
    params === null || params === undefined ? undefined : params,
  );
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Paramètres invalides." };
  }

  try {
    const data = await getLeadGenerationStock(parsed.data as GetLeadGenerationStockParams | undefined);
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement du stock.";
    return { ok: false, error: message };
  }
}
