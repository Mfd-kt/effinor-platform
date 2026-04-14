"use client";

import Link from "next/link";
import { ClipboardCheck, UserPlus } from "lucide-react";

import { DashboardKpiPreviousLine } from "@/features/dashboard/components/dashboard-kpi-previous-line";
import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";
import { cn } from "@/lib/utils";

/**
 * Activité leads / VT sur la **même** période que le sélecteur cockpit (URL `period`).
 * La comparaison utilise toujours la période précédente cohérente (jour → hier, semaine → semaine préc., etc.).
 */
export function DashboardPeriodOverview({ metrics }: { metrics: DashboardMetrics }) {
  const counts = metrics.periodCounts;
  const prevCounts = metrics.previousPeriodCounts;
  const iconClass = "size-4";

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Activité sur la période
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{metrics.periodLabel}</span>
            <span className="mx-2 text-border">·</span>
            <span>{metrics.periodDetailLabel}</span>
            <span className="mx-2 text-border">·</span>
            comparé à <span className="font-medium text-foreground">{metrics.comparisonPeriodLabel}</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-background p-1 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div
            className={cn(
              "rounded-xl border border-emerald-200/50 bg-card/90 p-5 shadow-sm",
              "dark:border-emerald-900/40 dark:bg-card/50",
            )}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <UserPlus className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Commercial</p>
                <p className="text-xs text-muted-foreground">Leads et rappels (créations / callbacks dans la fenêtre)</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/leads"
                className="group rounded-lg border border-border/60 bg-background/80 p-4 transition-colors hover:border-emerald-300/60 hover:bg-emerald-500/[0.04]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Nouveaux leads
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                  {counts.leadsCreated.toLocaleString("fr-FR")}
                </p>
                <DashboardKpiPreviousLine
                  title={metrics.comparisonPeriodLabel}
                  contextLabel=""
                  value={prevCounts.leadsCreated}
                />
              </Link>
              <Link
                href="/leads"
                className="group rounded-lg border border-border/60 bg-background/80 p-4 transition-colors hover:border-amber-300/60 hover:bg-amber-500/[0.04]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Rappels
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {counts.callbacks.toLocaleString("fr-FR")}
                </p>
                <DashboardKpiPreviousLine
                  title={metrics.comparisonPeriodLabel}
                  contextLabel=""
                  value={prevCounts.callbacks}
                />
              </Link>
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl border border-sky-200/50 bg-card/90 p-5 shadow-sm",
              "dark:border-sky-900/40 dark:bg-card/50",
            )}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300">
                <ClipboardCheck className={iconClass} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Visites techniques</p>
                <p className="text-xs text-muted-foreground">VT créées ou planifiées dans la fenêtre (voir agrégation serveur)</p>
              </div>
            </div>

            <Link
              href="/technical-visits"
              className="block rounded-lg border border-sky-200/40 bg-sky-500/[0.06] p-4 transition-colors hover:bg-sky-500/[0.1] dark:border-sky-900/30"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                VT sur la période
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {counts.technicalVisits.toLocaleString("fr-FR")}
              </p>
              <DashboardKpiPreviousLine
                title={metrics.comparisonPeriodLabel}
                contextLabel=""
                value={prevCounts.technicalVisits}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
