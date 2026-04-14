import type { OperationInsertInput } from "@/features/operations/schemas/operation.schema";

const KEY_DATE_FIELDS = [
  "technical_visit_date",
  "quote_sent_at",
  "quote_signed_at",
  "installation_start_at",
  "installation_end_at",
  "deposit_date",
  "prime_paid_at",
] as const satisfies readonly (keyof OperationInsertInput)[];

export type SuggestedKeyDates = Partial<
  Pick<
    OperationInsertInput,
    | "technical_visit_date"
    | "quote_sent_at"
    | "quote_signed_at"
    | "installation_start_at"
    | "installation_end_at"
    | "deposit_date"
    | "prime_paid_at"
  >
>;

/** Remplit uniquement les champs date encore vides (ne pas écraser une valeur déjà chargée). */
export function mergeSuggestedKeyDates(
  base: OperationInsertInput,
  suggestions: SuggestedKeyDates,
): OperationInsertInput {
  const next = { ...base };
  for (const k of KEY_DATE_FIELDS) {
    const v = suggestions[k];
    if (v === undefined || v === "") continue;
    const current = next[k];
    if (current === undefined || current === null || String(current).trim() === "") {
      (next as Record<string, unknown>)[k] = v;
    }
  }
  return next;
}
