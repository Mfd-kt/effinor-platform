import { ArrowUpRight, ClipboardCheck, LayoutDashboard, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";
import { cn } from "@/lib/utils";

import { DashboardAnalyticsCharts } from "@/features/dashboard/components/dashboard-analytics-charts";

import { DashboardCardTable, DashboardRecentLeadsTable } from "./dashboard-shared";
import { DashboardPeriodOverview } from "./dashboard-period-overview";

type Props = { metrics: DashboardMetrics };

const kpiTones = {
  emerald: {
    ring: "from-emerald-500/20 to-teal-500/5",
    iconBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
  },
  sky: {
    ring: "from-sky-500/20 to-cyan-500/5",
    iconBg: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    border: "border-sky-200/60 dark:border-sky-800/40",
  },
  violet: {
    ring: "from-violet-500/20 to-purple-500/5",
    iconBg: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    border: "border-violet-200/60 dark:border-violet-800/40",
  },
  amber: {
    ring: "from-amber-500/20 to-orange-500/5",
    iconBg: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    border: "border-amber-200/60 dark:border-amber-800/40",
  },
} as const;

function KpiCard({
  title,
  value,
  hint,
  icon,
  tone,
}: {
  title: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone: keyof typeof kpiTones;
}) {
  const t = kpiTones[tone];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-md",
        t.border,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl",
          t.ring,
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {value.toLocaleString("fr-FR")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
            t.iconBg,
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

const financialTones = {
  emerald: "border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-950/30 dark:to-emerald-950/10",
  sky: "border-sky-200/60 bg-gradient-to-br from-sky-50 to-sky-50/30 dark:from-sky-950/30 dark:to-sky-950/10",
  amber: "border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-50/30 dark:from-amber-950/30 dark:to-amber-950/10",
  slate: "border-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-50/30 dark:from-slate-800/20 dark:to-slate-900/10",
} as const;

function FinancialKpiCard({ label, value, tone }: { label: string; value: number; tone: keyof typeof financialTones }) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md", financialTones[tone])}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">{formatted}</p>
    </div>
  );
}

function PipelineSegment({ label, value, total, colorClass }: { label: string; value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-500", colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardSuperAdmin({ metrics }: Props) {
  const conversionPct =
    metrics.leadsTotal > 0 ? Math.round((metrics.leadsConverted / metrics.leadsTotal) * 100) : 0;
  const qualifiedPct =
    metrics.leadsTotal > 0 ? Math.round((metrics.leadsQualified / metrics.leadsTotal) * 100) : 0;

  return (
    <div className="space-y-10 pb-8">
      {/* Hero */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/60",
          "bg-gradient-to-br from-emerald-500/[0.07] via-background to-sky-500/[0.08]",
          "dark:from-emerald-950/30 dark:via-background dark:to-sky-950/20",
          "px-6 py-8 sm:px-10 sm:py-10",
        )}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-gradient-to-br from-emerald-400/20 to-sky-400/10 blur-3xl dark:from-emerald-500/10"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm dark:bg-background/40">
              <Sparkles className="size-3.5 text-amber-500" aria-hidden />
              Vue globale Effinor
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Tableau de bord</h1>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Vue synthétique : activité commerciale et visites techniques. Les données respectent votre périmètre
              d&apos;accès.
            </p>
            <p className="text-xs font-medium text-muted-foreground/90">
              {metrics.periodLabel} · {metrics.periodDetailLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/leads" className={cn(buttonVariants({ variant: "default" }), "gap-1.5 shadow-sm")}>
              Leads
              <ArrowUpRight className="size-4 opacity-80" />
            </Link>
            <Link href="/technical-visits" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 bg-background/50")}>
              Visites techniques
            </Link>
          </div>
        </div>
      </section>

      {/* Potentiel financier */}
      {metrics.financial.leadsSimulated > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" aria-hidden />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Potentiel financier
            </h2>
            <span
              className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              title={metrics.financialHint}
            >
              {metrics.financial.leadsSimulated} lead{metrics.financial.leadsSimulated > 1 ? "s" : ""} simulé{metrics.financial.leadsSimulated > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FinancialKpiCard
              label="Potentiel CA (Primes CEE)"
              value={metrics.financial.potentielCA}
              tone="emerald"
            />
            <FinancialKpiCard
              label="Économies clients / an"
              value={metrics.financial.economiesAnnuelles}
              tone="sky"
            />
            <div className={cn("rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md", "border-violet-200/60 bg-gradient-to-br from-violet-50 to-violet-50/30")}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Accords reçus</p>
              <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">{metrics.financial.accordsReceived}</p>
            </div>
            {metrics.financial.resteAChargeTotal > 0 && (
              <FinancialKpiCard
                label="Reste à charge clients"
                value={metrics.financial.resteAChargeTotal}
                tone="amber"
              />
            )}
          </div>
        </section>
      )}

      <DashboardPeriodOverview metrics={metrics} />

      {/* Totaux cumulés */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Totaux (période cockpit)
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            title="Leads créés"
            value={metrics.leadsTotal}
            hint={metrics.periodLabel}
            tone="emerald"
            icon={<LayoutDashboard className="size-5" />}
          />
          <KpiCard
            title="Visites techniques"
            value={metrics.vtTotal}
            hint="VT créées sur la période"
            tone="sky"
            icon={<ClipboardCheck className="size-5" />}
          />
        </div>
      </section>
      <DashboardAnalyticsCharts charts={metrics.charts} />

      {/* Pipeline insight */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div
          className={cn(
            "rounded-2xl border border-border/70 bg-card/50 p-6 shadow-sm backdrop-blur-sm",
            "dark:bg-card/30",
          )}
        >
          <h3 className="text-sm font-semibold text-foreground">Pipeline commercial</h3>
          <p className="mt-1 text-xs text-muted-foreground">Répartition des leads dans votre périmètre</p>
          <div className="mt-5 space-y-4">
            <PipelineSegment
              label="Qualifiés"
              value={metrics.leadsQualified}
              total={metrics.leadsTotal}
              colorClass="bg-sky-500 dark:bg-sky-400"
            />
            <PipelineSegment
              label="Convertis"
              value={metrics.leadsConverted}
              total={metrics.leadsTotal}
              colorClass="bg-emerald-500 dark:bg-emerald-400"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border/60 pt-4 text-xs">
            <span className="rounded-md bg-muted/80 px-2 py-1 font-medium tabular-nums text-foreground">
              Taux conversion&nbsp;: {conversionPct}%
            </span>
            <span className="rounded-md bg-muted/80 px-2 py-1 font-medium tabular-nums text-foreground">
              Part qualifiés&nbsp;: {qualifiedPct}%
            </span>
            {metrics.leadsCallbackDue > 0 ? (
              <span className="rounded-md bg-amber-500/15 px-2 py-1 font-medium text-amber-900 dark:text-amber-200">
                Rappels dus&nbsp;: {metrics.leadsCallbackDue}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-border/70 bg-card/50 p-6 shadow-sm backdrop-blur-sm",
            "dark:bg-card/30",
          )}
        >
          <h3 className="text-sm font-semibold text-foreground">Visites techniques</h3>
          <p className="mt-1 text-xs text-muted-foreground">Avancement du cycle VT</p>
          <div className="mt-5 space-y-4">
            <PipelineSegment
              label="À planifier"
              value={metrics.vtToSchedule}
              total={metrics.vtTotal}
              colorClass="bg-amber-500 dark:bg-amber-400"
            />
            <PipelineSegment
              label="Rapport en attente"
              value={metrics.vtReportPending}
              total={metrics.vtTotal}
              colorClass="bg-violet-500 dark:bg-violet-400"
            />
            <PipelineSegment
              label="Validées"
              value={metrics.vtValidated}
              total={metrics.vtTotal}
              colorClass="bg-emerald-500 dark:bg-emerald-400"
            />
          </div>
        </div>
      </section>

      {/* Tables */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Activité récente</h2>
        </div>
        <DashboardCardTable title="Leads récents" className="overflow-hidden border-border/70 shadow-md dark:shadow-none">
          <DashboardRecentLeadsTable metrics={metrics} />
        </DashboardCardTable>
      </section>
    </div>
  );
}
