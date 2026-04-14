import type { SupabaseClient } from "@supabase/supabase-js";

import {
  computeCeeKwhcFromSheet,
  sanitizeCeeInputValuesForSave,
} from "@/features/operations/lib/cee-calculation";
import type { OperationInsertInput, OperationUpdateInput } from "@/features/operations/schemas/operation.schema";
import type { Database, Json } from "@/types/database.types";

type OperationInsert = Database["public"]["Tables"]["operations"]["Insert"];
type OperationUpdate = Database["public"]["Tables"]["operations"]["Update"];

export function parseRowCeeInputValues(json: Json | null | undefined): Record<string, unknown> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  return { ...(json as Record<string, unknown>) };
}

export type ApplyCeeInsertResult =
  | { ok: true; row: OperationInsert }
  | { ok: false; message: string };

/**
 * Complète code fiche, valeurs et kWhc calculé à partir du référentiel `cee_sheets`.
 * Si pas de `cee_sheet_id`, ne modifie pas le code (dossiers historiques avec code saisi à la main).
 */
export async function applyCeeToOperationInsert(
  supabase: SupabaseClient<Database>,
  input: OperationInsertInput,
  base: OperationInsert,
): Promise<ApplyCeeInsertResult> {
  const sheetId = input.cee_sheet_id;
  if (!sheetId) {
    return {
      ok: true,
      row: {
        ...base,
        cee_sheet_id: null,
        cee_input_values: (base.cee_input_values ?? {}) as Json,
        cee_kwhc_calculated: input.cee_kwhc_calculated ?? null,
      },
    };
  }

  const { data: sheet, error } = await supabase
    .from("cee_sheets")
    .select("code, calculation_profile, calculation_config, input_fields")
    .eq("id", sheetId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !sheet) {
    return { ok: false, message: "Fiche CEE introuvable ou supprimée." };
  }

  const values = sanitizeCeeInputValuesForSave(input.cee_input_values);
  const kwhc = computeCeeKwhcFromSheet(sheet, values, input.cee_kwhc_calculated ?? null);

  return {
    ok: true,
    row: {
      ...base,
      cee_sheet_id: sheetId,
      cee_sheet_code: sheet.code,
      cee_input_values: values as unknown as Json,
      cee_kwhc_calculated: kwhc,
    },
  };
}

export function mergeOperationUpdateForCee(
  rest: Omit<OperationUpdateInput, "id">,
  existing: {
    cee_sheet_id: string | null;
    cee_input_values: Json;
    cee_kwhc_calculated: number | null;
    cee_sheet_code: string;
  } | null,
): Omit<OperationUpdateInput, "id"> {
  if (!existing) return rest;
  return {
    ...rest,
    cee_sheet_id: rest.cee_sheet_id !== undefined ? rest.cee_sheet_id : existing.cee_sheet_id,
    cee_input_values:
      rest.cee_input_values !== undefined
        ? rest.cee_input_values
        : parseRowCeeInputValues(existing.cee_input_values),
    cee_kwhc_calculated:
      rest.cee_kwhc_calculated !== undefined
        ? rest.cee_kwhc_calculated
        : (existing.cee_kwhc_calculated ?? undefined),
    cee_sheet_code: rest.cee_sheet_code !== undefined ? rest.cee_sheet_code : existing.cee_sheet_code,
  };
}

export async function applyCeePatchToOperationUpdate(
  supabase: SupabaseClient<Database>,
  merged: Omit<OperationUpdateInput, "id">,
  patch: OperationUpdate,
): Promise<{ ok: true; patch: OperationUpdate } | { ok: false; message: string }> {
  const sheetId = merged.cee_sheet_id;
  if (!sheetId) {
    const values = sanitizeCeeInputValuesForSave(merged.cee_input_values);
    return {
      ok: true,
      patch: {
        ...patch,
        cee_sheet_id: null,
        cee_input_values: values as unknown as Json,
        cee_kwhc_calculated: merged.cee_kwhc_calculated ?? null,
        cee_sheet_code: merged.cee_sheet_code?.trim() ?? "",
      },
    };
  }

  const { data: sheet, error } = await supabase
    .from("cee_sheets")
    .select("code, calculation_profile, calculation_config, input_fields")
    .eq("id", sheetId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !sheet) {
    return { ok: false, message: "Fiche CEE introuvable ou supprimée." };
  }

  const values = sanitizeCeeInputValuesForSave(merged.cee_input_values);
  const kwhc = computeCeeKwhcFromSheet(sheet, values, merged.cee_kwhc_calculated ?? null);

  return {
    ok: true,
    patch: {
      ...patch,
      cee_sheet_id: sheetId,
      cee_sheet_code: sheet.code,
      cee_input_values: values as unknown as Json,
      cee_kwhc_calculated: kwhc,
    },
  };
}
