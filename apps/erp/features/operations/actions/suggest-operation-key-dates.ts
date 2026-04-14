"use server";

import { getOperationKeyDateSuggestions } from "@/features/operations/queries/get-operation-key-date-suggestions";
import type { SuggestedKeyDates } from "@/features/operations/lib/merge-suggested-key-dates";
import { createClient } from "@/lib/supabase/server";

export type SuggestOperationKeyDatesResult =
  | { ok: true; suggestions: SuggestedKeyDates }
  | { ok: false; message: string };

/**
 * Sert à préremplir les champs « Dates clés » depuis VT / devis / chantier / factures.
 */
export async function suggestOperationKeyDates(input: {
  operationId?: string;
  referenceTechnicalVisitId?: string;
}): Promise<SuggestOperationKeyDatesResult> {
  try {
    const supabase = await createClient();
    const suggestions = await getOperationKeyDateSuggestions(supabase, {
      operationId: input.operationId?.trim() || null,
      referenceTechnicalVisitId: input.referenceTechnicalVisitId?.trim() || null,
    });
    return { ok: true, suggestions };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur lors du chargement des dates.";
    return { ok: false, message: msg };
  }
}
