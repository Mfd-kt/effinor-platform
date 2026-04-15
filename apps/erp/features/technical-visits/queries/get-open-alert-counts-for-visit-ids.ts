import { isTechnicalVisitAlertsTableUnavailable } from "@/features/technical-visits/alerts/technical-visit-alerts-schema-error";
import { createClient } from "@/lib/supabase/server";

/**
 * Compte les alertes pilotage encore ouvertes par visite (liste / onglet « À rectifier »).
 */
export async function getOpenAlertCountsForVisitIds(visitIds: string[]): Promise<Record<string, number>> {
  if (visitIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technical_visit_alerts")
    .select("technical_visit_id")
    .eq("status", "open")
    .in("technical_visit_id", visitIds);

  if (error) {
    if (isTechnicalVisitAlertsTableUnavailable(error)) {
      return {};
    }
    console.error("[getOpenAlertCountsForVisitIds]", error.message);
    return {};
  }

  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.technical_visit_id as string;
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}
