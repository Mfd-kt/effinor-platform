import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardCheck, Phone, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";

import { DashboardKpiPreviousLine } from "@/features/dashboard/components/dashboard-kpi-previous-line";

export { DashboardWeekMonthActions } from "./dashboard-week-month";

function TodayKpi({
  href,
  label,
  value,
  hint,
  icon,
  emphasize,
  previousTitle,
  previousContextLabel,
  previousValue,
}: {
  href: string;
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  emphasize?: boolean;
  previousTitle?: string;
  previousContextLabel?: string;
  previousValue?: number;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl bg-background/90 shadow-sm ring-1 ring-border/50",
            emphasize && "ring-2 ring-sky-500/35 dark:ring-sky-400/30",
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 tabular-nums tracking-tight text-foreground",
          emphasize ? "text-4xl font-bold sm:text-5xl" : "text-3xl font-semibold sm:text-4xl",
        )}
      >
        {value.toLocaleString("fr-FR")}
      </p>
      {previousTitle !== undefined && previousValue !== undefined ? (
        <DashboardKpiPreviousLine title={previousTitle} contextLabel={previousContextLabel ?? ""} value={previousValue} />
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </>
  );

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border bg-card/90 p-4 shadow-sm backdrop-blur-sm transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        emphasize
          ? "border-sky-300/70 bg-gradient-to-br from-sky-500/[0.08] via-card to-card dark:border-sky-800/50 dark:from-sky-950/25"
          : "border-border/80 hover:border-border",
      )}
    >
      {inner}
    </Link>
  );
}

/** Résumé cockpit — aligné sur `metrics.cockpitPeriod` (plus de « jour fixe » implicite). */
export function DashboardTodayActions({ metrics }: { metrics: DashboardMetrics }) {
  const c = metrics.periodCounts;
  const y = metrics.previousPeriodCounts;
  const iconClass = "size-4";

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {metrics.periodLabel}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <span className="font-medium capitalize text-foreground/90">{metrics.periodDetailLabel}</span>
          <span className="mx-2">·</span>
          comparé à {metrics.comparisonPeriodLabel}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <TodayKpi
          href="/leads"
          label="Nouveaux leads"
          value={c.leadsCreated}
          hint="Créés sur la période active"
          icon={<UserPlus className={cn(iconClass, "text-emerald-600 dark:text-emerald-400")} aria-hidden />}
          previousTitle={metrics.comparisonPeriodLabel}
          previousContextLabel=""
          previousValue={y.leadsCreated}
        />
        <TodayKpi
          href="/leads"
          label="Rappels"
          value={c.callbacks}
          hint="Callbacks dans la fenêtre"
          icon={<Phone className={cn(iconClass, "text-amber-600 dark:text-amber-400")} aria-hidden />}
          previousTitle={metrics.comparisonPeriodLabel}
          previousContextLabel=""
          previousValue={y.callbacks}
        />
        <TodayKpi
          href="/technical-visits"
          label="Visites techniques"
          value={c.technicalVisits}
          hint="VT sur la période (planifiées ou créées)"
          icon={<ClipboardCheck className={cn(iconClass, "text-sky-600 dark:text-sky-400")} aria-hidden />}
          emphasize
          previousTitle={metrics.comparisonPeriodLabel}
          previousContextLabel=""
          previousValue={y.technicalVisits}
        />
      </div>
    </section>
  );
}

function leadStatusVariant(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "converted":
      return "success";
    case "qualified":
      return "info";
    case "lost":
      return "danger";
    case "contacted":
      return "warning";
    case "nurturing":
      return "neutral";
    default:
      return "neutral";
  }
}

export function DashboardRecentLeadsTable({ metrics }: { metrics: DashboardMetrics }) {
  if (metrics.recentLeads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucun lead récent dans votre périmètre.</p>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/60 hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Société</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wide">Statut</TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Création</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.recentLeads.map((row) => (
          <TableRow key={row.id} className="border-border/40 transition-colors hover:bg-muted/40">
            <TableCell>
              <Link href={`/leads/${row.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                {row.company_name}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge variant={leadStatusVariant(row.lead_status)}>{row.lead_status}</StatusBadge>
            </TableCell>
            <TableCell className="text-right text-muted-foreground text-sm tabular-nums">
              {formatDateFr(row.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type DashboardChromeProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function DashboardChrome({ title, description, children }: DashboardChromeProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}

export function DashboardStatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function DashboardTwoColumn({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

export function DashboardCardTable({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/80 bg-card/60 shadow-sm backdrop-blur-sm dark:bg-card/40", className)}>
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-2 pt-0">{children}</CardContent>
    </Card>
  );
}
