import { createClient } from "@/lib/supabase/server";

import type { AccessContext } from "@/lib/auth/access-context";
import type { CockpitScopeFilters } from "@/features/dashboard/domain/cockpit";
import { getLeadIdsForAccess } from "@/lib/auth/data-scope";
import {
  getCockpitComparisonPeriodLabel,
  getCockpitPeriodDetailLabel,
  getCockpitPeriodLabel,
  getCockpitPeriodRange,
  getCockpitPreviousPeriodRange,
  listParisDayBucketRangesInCockpitPeriod,
  listTodayHourBuckets,
  type CockpitPeriod,
} from "@/features/dashboard/lib/cockpit-period";
import type { CockpitIsoRange } from "@/features/dashboard/lib/cockpit-period";

import {
  countLeadsCreatedInRange,
  fetchDashboardPeriodCounts,
  type DashboardTodayCounts,
} from "@/features/dashboard/queries/fetch-dashboard-period-counts";

export type { DashboardTodayCounts };

export type DashboardRecentLead = {
  id: string;
  company_name: string;
  created_at: string;
  lead_status: string;
};

export type DashboardChartPoint = {
  label: string;
  value: number;
};

/** Graphique « nouveaux leads » découpé selon la période cockpit (une seule série, même histoire que le sélecteur). */
export type CockpitChartSeries = {
  leadVolume: {
    title: string;
    description: string;
    points: DashboardChartPoint[];
  };
};

export type DashboardKpiFinancial = {
  potentielCA: number;
  coutInstallTotal: number;
  resteAChargeTotal: number;
  economiesAnnuelles: number;
  leadsSimulated: number;
  accordsReceived: number;
};

export type DashboardMetrics = {
  cockpitPeriod: CockpitPeriod;
  periodLabel: string;
  comparisonPeriodLabel: string;
  periodDetailLabel: string;
  currentRange: CockpitIsoRange;
  previousRange: CockpitIsoRange;
  /** Leads / rappels / VT sur la fenêtre cockpit courante. */
  periodCounts: DashboardTodayCounts;
  /** Même métrique sur la fenêtre de comparaison (période précédente alignée). */
  previousPeriodCounts: DashboardTodayCounts;
  charts: CockpitChartSeries;
  /** Leads créés sur la période (cohorte). */
  leadsTotal: number;
  leadsQualified: number;
  leadsConverted: number;
  leadsCallbackDue: number;
  /** Visites créées sur la période (tous statuts). */
  vtTotal: number;
  vtToSchedule: number;
  vtReportPending: number;
  vtValidated: number;
  recentLeads: DashboardRecentLead[];
  /** Simulations / agrégats financiers — leads **créés** sur la période avec simulation renseignée. */
  financial: DashboardKpiFinancial;
  financialHint: string;
};

async function buildLeadVolumeChart(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadIds: string[] | "all",
  period: CockpitPeriod,
  now: Date,
): Promise<CockpitChartSeries["leadVolume"]> {
  if (period === "today") {
    const buckets = listTodayHourBuckets(now);
    const points = await Promise.all(
      buckets.map(async (b) => ({
        label: b.label,
        value: await countLeadsCreatedInRange(supabase, leadIds, b.startIso, b.endIso),
      })),
    );
    return {
      title: "Nouveaux leads — journée",
      description:
        "Tranches horaires (Europe/Paris), jusqu’à l’heure actuelle · comparé à la période précédente dans les cartes ci-dessus.",
      points,
    };
  }

  const buckets = listParisDayBucketRangesInCockpitPeriod(period, now);
  const points = await Promise.all(
    buckets.map(async (b) => ({
      label: b.label,
      value: await countLeadsCreatedInRange(supabase, leadIds, b.startIso, b.endIso),
    })),
  );

  const desc =
    period === "week"
      ? "Chaque barre = un jour (lun. → aujourd’hui, Paris)."
      : period === "month"
        ? "Chaque barre = un jour du mois civil en cours (Paris)."
        : "Chaque barre = un jour sur les 30 derniers jours glissants.";

  return {
    title: "Nouveaux leads sur la période",
    description: desc,
    points,
  };
}

export async function getDashboardMetrics(
  access: AccessContext,
  period: CockpitScopeFilters["period"],
): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const now = new Date();

  const emptyCounts: DashboardTodayCounts = {
    leadsCreated: 0,
    callbacks: 0,
    technicalVisits: 0,
  };

  const emptyFinancial: DashboardKpiFinancial = {
    potentielCA: 0,
    coutInstallTotal: 0,
    resteAChargeTotal: 0,
    economiesAnnuelles: 0,
    leadsSimulated: 0,
    accordsReceived: 0,
  };

  const empty: DashboardMetrics = {
    cockpitPeriod: period,
    periodLabel: getCockpitPeriodLabel(period),
    comparisonPeriodLabel: getCockpitComparisonPeriodLabel(period),
    periodDetailLabel: getCockpitPeriodDetailLabel(period, now),
    currentRange: getCockpitPeriodRange(period, now),
    previousRange: getCockpitPreviousPeriodRange(period, now),
    periodCounts: emptyCounts,
    previousPeriodCounts: emptyCounts,
    charts: {
      leadVolume: {
        title: "",
        description: "",
        points: [],
      },
    },
    leadsTotal: 0,
    leadsQualified: 0,
    leadsConverted: 0,
    leadsCallbackDue: 0,
    vtTotal: 0,
    vtToSchedule: 0,
    vtReportPending: 0,
    vtValidated: 0,
    recentLeads: [],
    financial: emptyFinancial,
    financialHint: "Leads créés sur la période avec simulation renseignée.",
  };

  if (access.kind !== "authenticated") {
    return empty;
  }

  const leadIds = await getLeadIdsForAccess(supabase, access);
  /** Aucun lead CRM en périmètre (ex. agent 100 % LGC) : KPI CRM / VT à zéro, sans court-circuiter la structure. */
  const hasCrmLeadScope = leadIds === "all" || leadIds.length > 0;
  const IMPOSSIBLE_LEAD_ID = "00000000-0000-0000-0000-000000000001";

  const currentRange = getCockpitPeriodRange(period, now);
  const previousRange = getCockpitPreviousPeriodRange(period, now);

  const leadCountBase = () => {
    let q = supabase.from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (!hasCrmLeadScope) {
      return q.eq("id", IMPOSSIBLE_LEAD_ID);
    }
    if (leadIds !== "all") {
      q = q.in("id", leadIds);
    }
    return q;
  };

  const leadRowsBase = () => {
    let q = supabase.from("leads").select("id, company_name, created_at, lead_status").is("deleted_at", null);
    if (!hasCrmLeadScope) {
      return q.eq("id", IMPOSSIBLE_LEAD_ID);
    }
    if (leadIds !== "all") {
      q = q.in("id", leadIds);
    }
    return q;
  };

  const vtCountBase = () => {
    let q = supabase.from("technical_visits").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (!hasCrmLeadScope) {
      return q.eq("lead_id", IMPOSSIBLE_LEAD_ID);
    }
    if (leadIds !== "all") {
      q = q.in("lead_id", leadIds);
    }
    return q;
  };

  const [
    periodCounts,
    previousPeriodCounts,
    leadsQualifiedRes,
    leadsConvertedRes,
    leadsCallbackRes,
    recentLeadsRes,
    vtTotalRes,
    vtScheduleRes,
    vtReportRes,
    vtValidatedRes,
    accordsReceivedRes,
    chartSeries,
  ] = await Promise.all([
    fetchDashboardPeriodCounts(supabase, leadIds, currentRange.startIso, currentRange.endIso),
    fetchDashboardPeriodCounts(supabase, leadIds, previousRange.startIso, previousRange.endIso),
    leadCountBase()
      .eq("lead_status", "qualified")
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso),
    leadCountBase()
      .eq("lead_status", "converted")
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso),
    leadCountBase()
      .not("callback_at", "is", null)
      .gte("callback_at", currentRange.startIso)
      .lt("callback_at", currentRange.endIso),
    leadRowsBase()
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso)
      .order("created_at", { ascending: false })
      .limit(8),
    vtCountBase()
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso),
    vtCountBase()
      .eq("status", "to_schedule")
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso),
    vtCountBase()
      .eq("status", "report_pending")
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso),
    vtCountBase()
      .eq("status", "validated")
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso),
    leadCountBase()
      .eq("lead_status", "accord_received")
      .gte("created_at", currentRange.startIso)
      .lt("created_at", currentRange.endIso),
    buildLeadVolumeChart(supabase, leadIds, period, now),
  ]);

  const firstErr =
    leadsQualifiedRes.error ??
    leadsConvertedRes.error ??
    leadsCallbackRes.error ??
    recentLeadsRes.error ??
    vtTotalRes.error ??
    vtScheduleRes.error ??
    vtReportRes.error ??
    vtValidatedRes.error ??
    accordsReceivedRes.error;
  if (firstErr) {
    throw new Error(firstErr.message);
  }

  let financialQuery = supabase
    .from("leads")
    .select("sim_cee_prime_estimated, sim_install_total_price, sim_rest_to_charge, sim_saving_eur_30_selected")
    .is("deleted_at", null)
    .not("sim_cee_prime_estimated", "is", null)
    .gte("created_at", currentRange.startIso)
    .lt("created_at", currentRange.endIso);
  if (!hasCrmLeadScope) {
    financialQuery = financialQuery.eq("id", IMPOSSIBLE_LEAD_ID);
  } else if (leadIds !== "all") {
    financialQuery = financialQuery.in("id", leadIds);
  }
  const { data: financialRows } = await financialQuery;

  const financial: DashboardKpiFinancial = {
    potentielCA: 0,
    coutInstallTotal: 0,
    resteAChargeTotal: 0,
    economiesAnnuelles: 0,
    leadsSimulated: 0,
    accordsReceived: accordsReceivedRes.count ?? 0,
  };
  if (financialRows) {
    for (const r of financialRows) {
      financial.leadsSimulated++;
      financial.potentielCA += r.sim_cee_prime_estimated ?? 0;
      financial.coutInstallTotal += r.sim_install_total_price ?? 0;
      const rac = r.sim_rest_to_charge ?? 0;
      if (rac > 0) financial.resteAChargeTotal += rac;
      financial.economiesAnnuelles += r.sim_saving_eur_30_selected ?? 0;
    }
  }

  return {
    cockpitPeriod: period,
    periodLabel: getCockpitPeriodLabel(period),
    comparisonPeriodLabel: getCockpitComparisonPeriodLabel(period),
    periodDetailLabel: getCockpitPeriodDetailLabel(period, now),
    currentRange,
    previousRange,
    periodCounts,
    previousPeriodCounts,
    charts: { leadVolume: chartSeries },
    leadsTotal: periodCounts.leadsCreated,
    leadsQualified: leadsQualifiedRes.count ?? 0,
    leadsConverted: leadsConvertedRes.count ?? 0,
    leadsCallbackDue: leadsCallbackRes.count ?? 0,
    vtTotal: vtTotalRes.count ?? 0,
    vtToSchedule: vtScheduleRes.count ?? 0,
    vtReportPending: vtReportRes.count ?? 0,
    vtValidated: vtValidatedRes.count ?? 0,
    recentLeads: (recentLeadsRes.data ?? []) as DashboardRecentLead[],
    financial,
    financialHint: "Leads créés sur la période sélectionnée avec simulation renseignée.",
  };
}
