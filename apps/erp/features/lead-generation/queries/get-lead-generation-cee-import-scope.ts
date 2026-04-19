import { createClient } from "@/lib/supabase/server";

export type LeadGenerationCeeImportScope = {
  sheets: Array<{ id: string; code: string; label: string }>;
  teams: Array<{ id: string; ceeSheetId: string; name: string }>;
};

/**
 * Fiches CEE et équipes actives pour les formulaires d’import / campagne (périmètre référentiel).
 */
export async function getLeadGenerationCeeImportScope(): Promise<LeadGenerationCeeImportScope> {
  const supabase = await createClient();

  const [sheetsRes, teamsRes] = await Promise.all([
    supabase
      .from("cee_sheets")
      .select("id, code, label")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true }),
    supabase
      .from("cee_sheet_teams")
      .select("id, cee_sheet_id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const err = sheetsRes.error ?? teamsRes.error;
  if (err) {
    throw new Error(err.message);
  }

  return {
    sheets: (sheetsRes.data ?? []).map((s) => ({
      id: s.id,
      code: s.code?.trim() ?? "",
      label: s.label?.trim() ?? s.code ?? s.id,
    })),
    teams: (teamsRes.data ?? []).map((t) => ({
      id: t.id,
      ceeSheetId: t.cee_sheet_id,
      name: t.name?.trim() ?? t.id,
    })),
  };
}
