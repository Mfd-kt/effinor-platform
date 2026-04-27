import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isPostgrestMissingTableError } from "@/lib/supabase/postgrest-error";

import type { FunnelStep } from "../../widgets/funnel-chart";
import type { DashboardPeriod } from "../../shared/types";
import { getAdminCurrentRange } from "../lib/get-admin-date-ranges";

/**
 * Funnel global : agrégations plateforme sur la fenêtre courante.
 * — Stock : fiches LGC non terminées.
 * — Étapes suivantes : leads, RDV, accords, VT, installations, primes (dans la période ou à la date, selon la métrique).
 */
export async function getAdminFunnel(period: DashboardPeriod): Promise<FunnelStep[]> {
  const now = new Date();
  const { startIso, endIso } = getAdminCurrentRange(period, now);
  const supabase = await createClient();

  const [
    stockRes,
    qualifiedRes,
    rdvRes,
    accordsRes,
    vtRes,
    installsRes,
    primesRes,
  ] = await Promise.all([
    supabase
      .from("lead_generation_stock")
      .select("id", { count: "exact", head: true })
      .in("stock_status", ["new", "ready", "assigned", "in_progress"]),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("qualification_status", "qualified")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("technical_visits")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .not("scheduled_at", "is", null)
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("lead_status", "accord_received")
      .gte("updated_at", startIso)
      .lt("updated_at", endIso),
    supabase
      .from("technical_visits")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "validated")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("installations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("operations")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .not("prime_paid_at", "is", null)
      .gte("prime_paid_at", startIso)
      .lt("prime_paid_at", endIso),
  ]);

  function countOr(
    r: { count: number | null; error: { message: string; code?: string } | null },
    table: string,
  ): number {
    if (r.error) {
      if (isPostgrestMissingTableError(r.error, table)) return 0;
      throw new Error(r.error.message);
    }
    return r.count ?? 0;
  }

  return [
    { key: "stock", label: "Stock", value: countOr(stockRes, "lead_generation_stock") },
    { key: "qualified", label: "Qualifiés (période)", value: countOr(qualifiedRes, "leads") },
    { key: "appointments", label: "RDV", value: countOr(rdvRes, "technical_visits") },
    { key: "agreements", label: "Accords", value: countOr(accordsRes, "leads") },
    { key: "vt", label: "VT", value: countOr(vtRes, "technical_visits") },
    { key: "installs", label: "Installations", value: countOr(installsRes, "installations") },
    { key: "primes", label: "Primes", value: countOr(primesRes, "operations") },
  ];
}
