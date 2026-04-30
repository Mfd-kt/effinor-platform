/**
 * Utilitaires pour retirer des clés non modifiables avant envoi à Supabase.
 * Les payloads DB sont typés lâchement (Database stub) : les appelants
 * peuvent caster côté Supabase .update(...) si besoin.
 */

export function stripUpdatableFields<T extends object>(
  input: T,
  exclude: ReadonlyArray<keyof T | string>,
): Partial<T> {
  const excludeSet = new Set(exclude.map((k) => String(k)));
  const out: Partial<T> = {};
  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (excludeSet.has(key)) continue;
    const value = record[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

const LEAD_UPDATE_EXCLUSIONS = [
  "id",
  "lead_type",
  "created_at",
  "updated_at",
  "deleted_at",
  "lead_generation_stock_id",
  "lead_generation_assignment_id",
] as const;

/** Champs retirés avant UPDATE sur public.leads. */
export function buildLeadUpdatePayload(commonUpdate: Record<string, unknown>): Record<string, unknown> {
  return stripUpdatableFields(commonUpdate, LEAD_UPDATE_EXCLUSIONS);
}

const B2B_UPDATE_EXCLUSIONS = ["id", "lead_id", "archived_at", "created_at", "updated_at"] as const;

/** Champs retirés avant UPDATE sur public.leads_b2b. */
export function buildB2BUpdatePayload(b2bPatch: Record<string, unknown>): Record<string, unknown> {
  return stripUpdatableFields(b2bPatch, B2B_UPDATE_EXCLUSIONS);
}

const B2C_UPDATE_EXCLUSIONS = ["id", "lead_id", "archived_at", "created_at", "updated_at"] as const;

/** Champs retirés avant UPDATE sur public.leads_b2c. */
export function buildB2CUpdatePayload(b2cPatch: Record<string, unknown>): Record<string, unknown> {
  return stripUpdatableFields(b2cPatch, B2C_UPDATE_EXCLUSIONS);
}
