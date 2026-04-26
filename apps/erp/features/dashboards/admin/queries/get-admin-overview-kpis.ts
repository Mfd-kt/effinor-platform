import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isPostgrestMissingTableError } from "@/lib/supabase/postgrest-error";

import type { DashboardPeriod, Trend } from "../../shared/types";
import { computeTrend } from "../../shared/types";
import { getAdminCurrentRange, getAdminPreviousRange } from "../lib/get-admin-date-ranges";

export type AdminOverviewKpi = {
  key: "leads_created" | "agreements_signed" | "vt_done" | "premiums_paid" | "conversion_rate";
  label: string;
  value: number;
  /** Représentation textuelle (formatée fr-FR) — utile pour primes en € ou taux en %. */
  display: string;
  trend: Trend;
  trendPolarity?: "higher-is-better" | "lower-is-better";
  sublabel?: string;
};

export type AdminOverviewKpis = {
  period: DashboardPeriod;
  generatedAt: string;
  kpis: AdminOverviewKpi[];
};

async function countLeadsCreated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  startIso: string,
  endIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countAccordReceivedInRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  startIso: string,
  endIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("lead_status", "accord_received")
    .gte("updated_at", startIso)
    .lt("updated_at", endIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countVtValidatedInRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  startIso: string,
  endIso: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("technical_visits")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .eq("status", "validated")
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function sumPremiumsPaidInRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  startIso: string,
  endIso: string,
): Promise<{ count: number; amountEur: number }> {
  const { data, error } = await supabase
    .from("operations")
    .select("estimated_prime_amount")
    .is("deleted_at", null)
    .not("prime_paid_at", "is", null)
    .gte("prime_paid_at", startIso)
    .lt("prime_paid_at", endIso);
  if (error) {
    if (isPostgrestMissingTableError(error, "operations")) {
      return { count: 0, amountEur: 0 };
    }
    throw new Error(error.message);
  }
  let amountEur = 0;
  for (const row of data ?? []) {
    amountEur += Number((row as { estimated_prime_amount?: number | null }).estimated_prime_amount ?? 0);
  }
  return { count: (data ?? []).length, amountEur };
}

function leadToPrimeConversionRate(leads: number, primeDossiers: number): number {
  if (leads === 0) return 0;
  return Math.round((primeDossiers / leads) * 1000) / 10;
}

export async function getAdminOverviewKpis(period: DashboardPeriod): Promise<AdminOverviewKpis> {
  const now = new Date();
  const current = getAdminCurrentRange(period, now);
  const previous = getAdminPreviousRange(period, now);

  const supabase = await createClient();

  const [leads, leadsPrev, accords, accordsPrev, vt, vtPrev, primeCur, primePrev] = await Promise.all([
    countLeadsCreated(supabase, current.startIso, current.endIso),
    countLeadsCreated(supabase, previous.startIso, previous.endIso),
    countAccordReceivedInRange(supabase, current.startIso, current.endIso),
    countAccordReceivedInRange(supabase, previous.startIso, previous.endIso),
    countVtValidatedInRange(supabase, current.startIso, current.endIso),
    countVtValidatedInRange(supabase, previous.startIso, previous.endIso),
    sumPremiumsPaidInRange(supabase, current.startIso, current.endIso),
    sumPremiumsPaidInRange(supabase, previous.startIso, previous.endIso),
  ]);

  const convRate = leadToPrimeConversionRate(leads, primeCur.count);
  const convPrev = leadToPrimeConversionRate(leadsPrev, primePrev.count);

  const eur = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
      n,
    );

  return {
    period,
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        key: "leads_created",
        label: "Leads créés",
        value: leads,
        display: leads.toLocaleString("fr-FR"),
        trend: computeTrend(leads, leadsPrev),
        sublabel: "vs période précédente",
      },
      {
        key: "agreements_signed",
        label: "Accords signés",
        value: accords,
        display: accords.toLocaleString("fr-FR"),
        trend: computeTrend(accords, accordsPrev),
        sublabel: "vs période précédente",
      },
      {
        key: "vt_done",
        label: "VT réalisées",
        value: vt,
        display: vt.toLocaleString("fr-FR"),
        trend: computeTrend(vt, vtPrev),
        sublabel: "vs période précédente",
      },
      {
        key: "premiums_paid",
        label: "Primes payées",
        value: primeCur.count,
        display: eur(primeCur.amountEur),
        trend: computeTrend(primeCur.amountEur, primePrev.amountEur),
        sublabel: `${primeCur.count.toLocaleString("fr-FR")} dossiers`,
      },
      {
        key: "conversion_rate",
        label: "Taux de conversion",
        value: convRate,
        display: `${convRate.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`,
        trend: computeTrend(convRate, convPrev),
        sublabel: "lead → prime",
        trendPolarity: "higher-is-better",
      },
    ],
  };
}
