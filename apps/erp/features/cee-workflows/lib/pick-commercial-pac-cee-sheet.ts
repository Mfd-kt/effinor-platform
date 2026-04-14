import type { SupabaseClient } from "@supabase/supabase-js";

import { simulationRecommendedCategoryLabel } from "@/features/leads/lib/resolve-lead-commercial-category";
import type { Database, Json } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

/** Fiche CEE « commerciale PAC » : `simulator_key` = `pac` ou préfixe `pac_` / `pac-`. */
export function pickPacCeeSheetIdFromRows(rows: { id: string; simulator_key: string | null }[]): string | null {
  if (!rows.length) return null;
  const sk = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
  const byKey = (pred: (k: string) => boolean) => rows.find((r) => pred(sk(r.simulator_key)));
  const exactPac = byKey((k) => k === "pac");
  if (exactPac) return exactPac.id;
  const prefixed = byKey((k) => k.startsWith("pac_") || k.startsWith("pac-"));
  if (prefixed) return prefixed.id;
  return null;
}

/**
 * Résout l’id fiche PAC active dans le catalogue (`simulator_key` explicite, pas le libellé).
 */
export async function pickCommercialPacCeeSheetId(supabase: Supabase): Promise<string | null> {
  const { data, error } = await supabase
    .from("cee_sheets")
    .select("id, simulator_key")
    .is("deleted_at", null)
    .eq("is_commercial_active", true);

  if (error || !data?.length) {
    return null;
  }
  return pickPacCeeSheetIdFromRows(data);
}

/**
 * Si la simulation conclut à une PAC, rattacher le dossier à la fiche CEE PAC du catalogue
 * (même quand l’agent a ouvert le poste depuis une fiche déstratification).
 */
export async function resolveEffectiveAgentCeeSheetId(
  supabase: Supabase,
  requestedCeeSheetId: string,
  simulationResultJson: Json | undefined,
): Promise<string> {
  if (simulationRecommendedCategoryLabel(simulationResultJson) !== "PAC") {
    return requestedCeeSheetId;
  }
  const pacId = await pickCommercialPacCeeSheetId(supabase);
  if (!pacId) {
    return requestedCeeSheetId;
  }
  return pacId;
}
