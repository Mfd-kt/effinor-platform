import { BarChart3, ClipboardList, TrendingUp, Users } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { cn } from "@/lib/utils";

import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";

import { DashboardAnalyticsCharts } from "@/features/dashboard/components/dashboard-analytics-charts";

import {
  DashboardCardTable,
  DashboardChrome,
  DashboardRecentLeadsTable,
  DashboardStatGrid,
  DashboardTwoColumn,
} from "./dashboard-shared";
import { DashboardPeriodOverview } from "./dashboard-period-overview";

type Props = { metrics: DashboardMetrics };

const finTones = {
  emerald: "border-emerald-200/60 bg-emerald-50/50",
  sky: "border-sky-200/60 bg-sky-50/50",
  amber: "border-amber-200/60 bg-amber-50/50",
  slate: "border-slate-200/60 bg-slate-50/50",
} as const;

function FinChip({ label, value, tone }: { label: string; value: number; tone: keyof typeof finTones }) {
  const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", finTones[tone])}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-foreground">{fmt}</p>
    </div>
  );
}

export function DashboardSalesDirector({ metrics }: Props) {
  return (
    <DashboardChrome
      title="Performance commerciale"
      description="Vue globale équipe — volumes et tendances (périmètre complet)."
    >
      {metrics.financial.leadsSimulated > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Potentiel financier équipe
            </h2>
            <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {metrics.financial.leadsSimulated} lead{metrics.financial.leadsSimulated > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FinChip label="Potentiel CA" value={metrics.financial.potentielCA} tone="emerald" />
            <FinChip label="Économies clients / an" value={metrics.financial.economiesAnnuelles} tone="sky" />
            <div className={cn("rounded-xl border p-4 shadow-sm", "border-violet-200/60 bg-violet-50/50")}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Accords reçus</p>
              <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-foreground">{metrics.financial.accordsReceived}</p>
            </div>
            {metrics.financial.resteAChargeTotal > 0 && (
              <FinChip label="Reste à charge" value={metrics.financial.resteAChargeTotal} tone="amber" />
            )}
          </div>
        </section>
      )}

      <DashboardPeriodOverview metrics={metrics} />
      <DashboardAnalyticsCharts charts={metrics.charts} />
      <DashboardStatGrid>
        <StatCard
          title="Leads créés"
          value={metrics.leadsTotal}
          hint={`Sur ${metrics.periodLabel.toLowerCase()} (cohorte)`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          title="Qualifiés"
          value={metrics.leadsQualified}
          hint="Créés sur la période, statut qualifié"
          icon={<BarChart3 className="size-4" />}
        />
        <StatCard
          title="Visites techniques"
          value={metrics.vtTotal}
          hint="VT créées sur la période"
          icon={<ClipboardList className="size-4" />}
        />
        <StatCard
          title="VT validées"
          value={metrics.vtValidated}
          hint="Créées sur la période, statut validé"
          icon={<TrendingUp className="size-4" />}
        />
      </DashboardStatGrid>
      <DashboardTwoColumn
        left={
          <DashboardCardTable title="Leads récents (équipe)">
            <DashboardRecentLeadsTable metrics={metrics} />
          </DashboardCardTable>
        }
        right={
          <DashboardCardTable title="Indicateurs VT">
            <p className="px-4 py-3 text-sm text-muted-foreground">
              À planifier : <span className="font-medium text-foreground">{metrics.vtToSchedule}</span>
              {" · "}Rapport en attente :{" "}
              <span className="font-medium text-foreground">{metrics.vtReportPending}</span>
            </p>
          </DashboardCardTable>
        }
      />
    </DashboardChrome>
  );
}
