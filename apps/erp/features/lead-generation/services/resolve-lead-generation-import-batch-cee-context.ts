import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedLeadGenerationImportBatchCee = {
  cee_sheet_id: string;
  cee_sheet_code: string;
  target_team_id: string;
};

/**
 * Vérifie que l’équipe appartient à la fiche CEE et renvoie le code fiche pour persistance dénormalisée.
 */
export async function resolveLeadGenerationImportBatchCeeContext(
  supabase: SupabaseClient,
  ceeSheetId: string,
  targetTeamId: string,
): Promise<{ ok: true; data: ResolvedLeadGenerationImportBatchCee } | { ok: false; error: string }> {
  const sheetId = ceeSheetId.trim();
  const teamId = targetTeamId.trim();
  if (!sheetId || !teamId) {
    return { ok: false, error: "Fiche CEE et équipe cible sont requis." };
  }

  const [{ data: sheet, error: sheetErr }, { data: team, error: teamErr }] = await Promise.all([
    supabase.from("cee_sheets").select("id, code").eq("id", sheetId).is("deleted_at", null).maybeSingle(),
    supabase
      .from("cee_sheet_teams")
      .select("id, cee_sheet_id, is_active")
      .eq("id", teamId)
      .maybeSingle(),
  ]);

  const err = sheetErr ?? teamErr;
  if (err) {
    return { ok: false, error: err.message };
  }
  if (!sheet?.id) {
    return { ok: false, error: "Fiche CEE introuvable ou inactive." };
  }
  if (!team?.id) {
    return { ok: false, error: "Équipe cible introuvable." };
  }
  if (!team.is_active) {
    return { ok: false, error: "L’équipe choisie n’est pas active." };
  }
  if (team.cee_sheet_id !== sheetId) {
    return { ok: false, error: "L’équipe sélectionnée ne correspond pas à cette fiche CEE." };
  }

  const code = typeof sheet.code === "string" ? sheet.code.trim() : "";
  if (!code) {
    return { ok: false, error: "La fiche CEE n’a pas de code exploitable." };
  }

  return {
    ok: true,
    data: {
      cee_sheet_id: sheetId,
      cee_sheet_code: code.slice(0, 80),
      target_team_id: teamId,
    },
  };
}
