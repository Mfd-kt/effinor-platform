import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatPostgrestError, isPostgrestMissingTableError } from "@/lib/supabase/postgrest-error";

import type { SourceSlice } from "../../widgets/source-breakdown";
import type { DashboardPeriod } from "../../shared/types";
import { getAdminCurrentRange } from "../lib/get-admin-date-ranges";

const PALETTE = ["#f97316", "#0ea5e9", "#8b5cf6", "#10b981", "#eab308", "#64748b", "#ec4899", "#14b8a6"];

const SOURCE_LABELS = new Map<string, string>([
  ["lead_generation", "Lead gen (LBC / imports)"],
  ["website", "Site web"],
  ["phone", "Téléphone"],
  ["cold_call", "Prospection"],
  ["referral", "Recommandation"],
  ["partner", "Partenaire"],
  ["landing_pac", "Landing PAC"],
  ["landing_reno_global", "Landing réno globale"],
  ["simulator_cee", "Simulateur CEE"],
  ["commercial_callback", "Rappel commercial"],
  ["site_internet", "Site internet"],
  ["kompas", "Kompas"],
  ["prospecting_kompas", "Prospection Kompas"],
  ["hpf", "HPF"],
  ["landing_froid", "Landing froid"],
  ["landing_lum", "Lum"],
  ["landing_destrat", "Destrat"],
  ["other", "Autre"],
]);

function labelForSourceKey(key: string): string {
  return SOURCE_LABELS.get(key) ?? key.replace(/_/g, " ");
}

/**
 * Ventilation des **leads créés** sur la période, par `leads.source`.
 * Une seule requête + agrégation côté app (évite les `eq` sur des valeurs d’enum
 * parfois absentes du type PostgREST / moteur SQL — ex. `landing_pac` selon l’ordre de migration).
 */
export async function getAdminSources(period: DashboardPeriod): Promise<SourceSlice[]> {
  const now = new Date();
  const { startIso, endIso } = getAdminCurrentRange(period, now);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("source")
    .is("deleted_at", null)
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (error) {
    if (isPostgrestMissingTableError(error, "leads")) {
      return [];
    }
    throw new Error(formatPostgrestError(error, "leads (sources)"));
  }

  const bySource = new Map<string, number>();
  for (const row of data ?? []) {
    const src = (row as { source: string | null }).source;
    if (src == null || src === "") continue;
    bySource.set(src, (bySource.get(src) ?? 0) + 1);
  }

  const entries = [...bySource.entries()]
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return entries.map(([key, value], i) => ({
    key,
    label: labelForSourceKey(key),
    value,
    color: PALETTE[i % PALETTE.length],
  }));
}
