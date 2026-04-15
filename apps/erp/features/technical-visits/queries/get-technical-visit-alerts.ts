import { isTechnicalVisitAlertsTableUnavailable } from "@/features/technical-visits/alerts/technical-visit-alerts-schema-error";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type TechnicalVisitAlertRow = Database["public"]["Tables"]["technical_visit_alerts"]["Row"];

function severityRank(s: string): number {
  if (s === "critical") return 0;
  if (s === "warning") return 1;
  return 2;
}

export async function getOpenTechnicalVisitAlerts(visitId: string): Promise<TechnicalVisitAlertRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technical_visit_alerts")
    .select("*")
    .eq("technical_visit_id", visitId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    if (isTechnicalVisitAlertsTableUnavailable(error)) {
      return [];
    }
    console.error("[getOpenTechnicalVisitAlerts]", error.message);
    return [];
  }

  const rows = data ?? [];
  return [...rows].sort((a, b) => {
    const dr = severityRank(a.severity) - severityRank(b.severity);
    if (dr !== 0) return dr;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function summarizeOpenPilotageAlerts(alerts: TechnicalVisitAlertRow[]): {
  openCount: number;
  criticalCount: number;
  warningCount: number;
} {
  return {
    openCount: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === "critical").length,
    warningCount: alerts.filter((a) => a.severity === "warning").length,
  };
}
