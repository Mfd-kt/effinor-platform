import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardCheck, Phone, UserPlus } from "lucide-react";

import { DashboardKpiPreviousLine } from "@/features/dashboard/components/dashboard-kpi-previous-line";
import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";
import { cn } from "@/lib/utils";

function PeriodKpi({
  href,
  label,
  value,
  hint,
  icon,
  previousTitle,
  previousValue,
}: {
  href: string;
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  previousTitle?: string;
  previousValue?: number;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background/90 shadow-sm ring-1 ring-border/50">
          {icon}
        </span>
      </div>
      <p className="mt-3 tabular-nums tracking-tight text-3xl font-semibold text-foreground sm:text-4xl">
        {value.toLocaleString("fr-FR")}
      </p>
      {previousTitle !== undefined && previousValue !== undefined ? (
        <DashboardKpiPreviousLine title={previousTitle} contextLabel="" value={previousValue} />
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </>
  );

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-border",
      )}
    >
      {inner}
    </Link>
  );
}

/** @deprecated Préférer `DashboardPeriodOverview` — conservé pour compat ; utilise la même fenêtre cockpit. */
export function DashboardWeekMonthActions({ metrics }: { metrics: DashboardMetrics }) {
  const iconClass = "size-4";
  const c = metrics.periodCounts;
  const p = metrics.previousPeriodCounts;

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Synthèse période (cockpit)
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/90">{metrics.periodLabel}</span>
          <span className="mx-2">·</span>
          {metrics.periodDetailLabel}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <PeriodKpi
          href="/leads"
          label="Nouveaux leads"
          value={c.leadsCreated}
          hint="Créés dans la fenêtre cockpit active"
          icon={<UserPlus className={cn(iconClass, "text-emerald-600 dark:text-emerald-400")} aria-hidden />}
          previousTitle={metrics.comparisonPeriodLabel}
          previousValue={p.leadsCreated}
        />
        <PeriodKpi
          href="/leads"
          label="Rappels"
          value={c.callbacks}
          hint="Callbacks prévus dans la fenêtre"
          icon={<Phone className={cn(iconClass, "text-amber-600 dark:text-amber-400")} aria-hidden />}
          previousTitle={metrics.comparisonPeriodLabel}
          previousValue={p.callbacks}
        />
        <PeriodKpi
          href="/technical-visits"
          label="Visites techniques"
          value={c.technicalVisits}
          hint="Activité VT sur la fenêtre"
          icon={<ClipboardCheck className={cn(iconClass, "text-sky-600 dark:text-sky-400")} aria-hidden />}
          previousTitle={metrics.comparisonPeriodLabel}
          previousValue={p.technicalVisits}
        />
      </div>
    </section>
  );
}
