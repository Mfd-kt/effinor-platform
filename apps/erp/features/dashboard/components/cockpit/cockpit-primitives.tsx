import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
  Radio,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import type {
  CockpitAlert,
  CockpitAlertPriorityLevel,
  CockpitPriorityQueueKey,
} from "@/features/dashboard/domain/cockpit";
import type {
  CockpitFunnelCounts,
  CockpitQueueItem,
  CockpitSheetRollup,
  CockpitWorkflowSnapshot,
} from "@/features/dashboard/domain/cockpit";
import { conversionRate } from "@/features/dashboard/lib/cockpit-aggregates";
import { cn } from "@/lib/utils";

export function CockpitPageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="space-y-2 border-b border-border/60 pb-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600/90 dark:text-emerald-400">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </header>
  );
}

export function CockpitSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const alertStyles: Record<CockpitAlert["severity"], string> = {
  critical: "border-red-200/80 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30",
  warning: "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/25",
  info: "border-sky-200/70 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20",
};

const severityBadgeClass: Record<CockpitAlert["severity"], string> = {
  critical: "border-red-300/80 bg-red-100/80 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
  warning: "border-amber-300/80 bg-amber-100/70 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  info: "border-sky-300/70 bg-sky-100/60 text-sky-950 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100",
};

const priorityLevelBadgeClass: Record<CockpitAlertPriorityLevel, string> = {
  urgent: "border-red-400/90 bg-red-600/15 text-red-950 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100",
  high: "border-orange-400/80 bg-orange-500/15 text-orange-950 dark:border-orange-700 dark:bg-orange-950/35 dark:text-orange-100",
  medium: "border-amber-400/80 bg-amber-400/12 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100",
  low: "border-border bg-muted/50 text-muted-foreground",
};

const priorityLevelLabel: Record<CockpitAlertPriorityLevel, string> = {
  urgent: "Priorité urgente",
  high: "Priorité haute",
  medium: "Priorité moyenne",
  low: "Priorité basse",
};

const WORKFLOW_STATUS_FR: Record<string, string> = {
  draft: "Brouillon",
  simulation_done: "Simulation validée",
  to_confirm: "À confirmer",
  qualified: "Qualifié",
  docs_prepared: "Docs préparés",
  to_close: "En clôture",
  agreement_sent: "Accord envoyé",
  agreement_signed: "Signé",
  quote_pending: "Devis en attente",
  quote_sent: "Devis envoyé",
  quote_signed: "Devis signé",
  technical_visit_pending: "VT à planifier",
  technical_visit_done: "VT réalisée",
  installation_pending: "Installation en attente",
  cee_deposit_pending: "Dépôt CEE en attente",
  cee_deposited: "CEE déposé",
  paid: "Payé",
  lost: "Perdu",
};

function workflowStatusFr(status: string): string {
  return WORKFLOW_STATUS_FR[status] ?? status;
}

function formatImpactEur(value: number | null): string | null {
  if (value == null) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

const PRIORITY_QUEUE_LABELS: Record<CockpitPriorityQueueKey, string> = {
  staleDrafts: "File « brouillons inactifs »",
  docsPreparedStale: "File « docs prêts (stale) »",
  agreementsAwaitingSign: "File « accords en signature »",
  oldAgreementSent: "File « accords à relancer »",
};

function formatMetricSnippet(a: CockpitAlert): string | null {
  if (a.metricValue == null && a.comparisonValue == null && a.thresholdValue == null) return null;
  const parts: string[] = [];
  if (a.metricValue != null) {
    const rateLike = a.category === "conversion" || a.category === "loss";
    parts.push(
      rateLike && a.metricValue >= 0 && a.metricValue <= 1
        ? `Valeur : ${Math.round(a.metricValue * 1000) / 10} %`
        : `Valeur : ${a.metricValue}`,
    );
  }
  if (a.thresholdValue != null) {
    parts.push(`Seuil : ${a.thresholdValue}`);
  }
  if (a.comparisonValue != null) {
    parts.push(
      typeof a.comparisonValue === "number" && a.comparisonValue > 0 && a.comparisonValue <= 100
        ? `Écart : ${a.comparisonValue} %`
        : `Réf. : ${a.comparisonValue}`,
    );
  }
  return parts.length ? parts.join(" · ") : null;
}

export function CockpitAlertSummary({ alerts }: { alerts: CockpitAlert[] }) {
  if (alerts.length === 0) return null;
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const info = alerts.filter((a) => a.severity === "info").length;
  const bits: string[] = [];
  if (critical) bits.push(`${critical} critique${critical > 1 ? "s" : ""}`);
  if (warning) bits.push(`${warning} avertissement${warning > 1 ? "s" : ""}`);
  if (info) bits.push(`${info} info`);
  return (
    <p className="text-xs font-medium text-muted-foreground">
      Synthèse : {bits.join(" · ")} ({alerts.length} au total)
    </p>
  );
}

export function CockpitAlertCard({ alert: a }: { alert: CockpitAlert }) {
  const impactLabel = formatImpactEur(a.estimatedImpactEuro);
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border px-4 py-3 sm:flex-row sm:items-start sm:justify-between",
        alertStyles[a.severity],
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <p className="text-sm font-semibold text-foreground">{a.title}</p>
          <Badge variant="outline" className={cn("text-[9px] font-semibold", severityBadgeClass[a.severity])}>
            {a.severity === "critical" ? "Critique" : a.severity === "warning" ? "Attention" : "Info"}
          </Badge>
          <Badge variant="outline" className={cn("text-[9px] font-semibold", priorityLevelBadgeClass[a.priorityLevel])}>
            {priorityLevelLabel[a.priorityLevel]}
          </Badge>
          <Badge variant="outline" className="text-[9px] font-normal text-muted-foreground">
            {a.scope === "structural" ? "Structure" : "Période"}
          </Badge>
          <Badge variant="outline" className="text-[9px] font-normal capitalize text-muted-foreground">
            {a.category}
          </Badge>
          {a.workflowsCount > 0 ? (
            <Badge variant="secondary" className="text-[10px] tabular-nums">
              {a.workflowsCount} dossier{a.workflowsCount > 1 ? "s" : ""}
            </Badge>
          ) : a.count != null ? (
            <Badge variant="secondary" className="text-[10px]">
              {a.count}
            </Badge>
          ) : null}
        </div>
        {a.targetLabel ? (
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">Cible :</span> {a.targetLabel}
            {a.targetType !== "global" ? (
              <span className="ml-1 text-muted-foreground/80">({a.targetType})</span>
            ) : null}
          </p>
        ) : null}
        <p className="text-xs leading-relaxed text-muted-foreground">{a.message}</p>
        {impactLabel ? (
          <p className="text-[11px] font-medium tabular-nums text-foreground/90">
            Impact estimé : <span className="text-emerald-800 dark:text-emerald-300">{impactLabel}</span>
          </p>
        ) : null}
        {formatMetricSnippet(a) ? (
          <p className="text-[11px] tabular-nums text-muted-foreground/90">{formatMetricSnippet(a)}</p>
        ) : null}
        <p className="text-xs font-medium leading-snug text-foreground/90">
          <span className="text-muted-foreground">Action :</span> {a.suggestedAction}
        </p>
        {a.relatedQueueKey ? (
          <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
            File cockpit : {PRIORITY_QUEUE_LABELS[a.relatedQueueKey]}
          </p>
        ) : null}
        {a.topWorkflows.length > 0 ? (
          <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Dossiers prioritaires
            </p>
            <ul className="mt-2 divide-y divide-border/50">
              {a.topWorkflows.map((w) => (
                <li key={w.workflowId} className="flex flex-wrap items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link
                      href={`/leads/${w.leadId}`}
                      className="text-sm font-medium text-foreground hover:text-emerald-700 hover:underline dark:hover:text-emerald-400"
                    >
                      {w.companyName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {workflowStatusFr(w.currentStatus)}
                      {w.daysSinceLastAction != null ? ` · J+${w.daysSinceLastAction}` : null}
                      {w.potentialValue != null ? (
                        <span className="tabular-nums">
                          {" "}
                          · {formatImpactEur(w.potentialValue)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    score {Math.round(w.priorityScore)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <Link
          href={a.cta.href}
          className={cn(
            buttonVariants({ size: "sm" }),
            "w-full sm:w-auto inline-flex items-center gap-1 no-underline",
          )}
        >
          {a.cta.label}
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function CockpitAlertStack({ alerts }: { alerts: CockpitAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <CockpitAlertCard key={a.id} alert={a} />
      ))}
    </div>
  );
}

export function CockpitAlertSections({
  periodAlerts,
  structuralAlerts,
  periodLabel,
}: {
  periodAlerts: CockpitAlert[];
  structuralAlerts: CockpitAlert[];
  periodLabel: string;
}) {
  if (periodAlerts.length === 0 && structuralAlerts.length === 0) return null;
  return (
    <div className="space-y-6">
      {periodAlerts.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Alertes période · {periodLabel}
          </p>
          <CockpitAlertSummary alerts={periodAlerts} />
          <CockpitAlertStack alerts={periodAlerts} />
        </div>
      ) : null}
      {structuralAlerts.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Santé réseau (hors filtre période)
          </p>
          <CockpitAlertSummary alerts={structuralAlerts} />
          <CockpitAlertStack alerts={structuralAlerts} />
        </div>
      ) : null}
    </div>
  );
}

export function CockpitFunnelStrip({ funnel }: { funnel: CockpitFunnelCounts }) {
  const steps: { key: keyof CockpitFunnelCounts; label: string }[] = [
    { key: "draft", label: "Brouillon" },
    { key: "simulation_done", label: "Simulé" },
    { key: "to_confirm", label: "À confirmer" },
    { key: "qualified", label: "Qualifié" },
    { key: "docs_prepared", label: "Docs" },
    { key: "to_close", label: "À closer" },
    { key: "agreement_sent", label: "Envoyé" },
    { key: "agreement_signed", label: "Signé" },
    { key: "lost", label: "Perdu" },
  ];
  const max = Math.max(1, ...steps.map((s) => (funnel[s.key] as number) ?? 0));
  return (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
      {steps.map((s) => {
        const v = (funnel[s.key] as number) ?? 0;
        const pct = Math.round((v / max) * 100);
        return (
          <div
            key={String(s.key)}
            className="rounded-lg border border-border/70 bg-card/50 px-2.5 py-2 text-center"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{v}</p>
            <div className="mx-auto mt-1 h-1 max-w-[48px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500/80"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CockpitQueueTable({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: CockpitQueueItem[];
  emptyLabel: string;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((it) => (
              <li key={it.workflowId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/leads/${it.leadId}`}
                    className="truncate text-sm font-medium text-foreground hover:text-emerald-700 hover:underline dark:hover:text-emerald-400"
                  >
                    {it.companyName}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {it.sheetLabel} · {it.status}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CockpitPriorityGrid({
  snap,
  subtitle = "Uniquement les workflows créés dans la période sélectionnée (et encore actifs sur ces files).",
}: {
  snap: CockpitWorkflowSnapshot;
  subtitle?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <div className="grid gap-4 lg:grid-cols-2">
      <CockpitQueueTable
        title="Brouillons inactifs"
        items={snap.priorityQueues.staleDrafts}
        emptyLabel="Aucun brouillon ancien."
      />
      <CockpitQueueTable
        title="Docs prêts (délai)"
        items={snap.priorityQueues.docsPreparedStale}
        emptyLabel="Pas de docs prêts en retard."
      />
      <CockpitQueueTable
        title="Accords envoyés (signature)"
        items={snap.priorityQueues.agreementsAwaitingSign}
        emptyLabel="Aucun accord en attente."
      />
      <CockpitQueueTable
        title="Accords à relancer (délai)"
        items={snap.priorityQueues.oldAgreementSent}
        emptyLabel="Pas de relance prioritaire."
      />
      </div>
    </div>
  );
}

export function CockpitSheetPerformanceTable({ rows }: { rows: CockpitSheetRollup[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3">Fiche</th>
            <th className="px-4 py-3 text-right">Dossiers</th>
            <th className="px-4 py-3 text-right">Envoyés</th>
            <th className="px-4 py-3 text-right">Signés</th>
            <th className="px-4 py-3 text-right">Perdus</th>
            <th className="px-4 py-3 text-right">Tx sign.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sheetId} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 font-medium">{r.sheetLabel}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.workflowCount}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.sent}</td>
              <td className="px-4 py-3 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                {r.signed}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-amber-800 dark:text-amber-300">
                {r.lost}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {conversionRate(r.signed, r.sent) != null
                  ? `${conversionRate(r.signed, r.sent)} %`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CockpitKpiBusinessRow({
  snap,
  leadsCreatedPeriod,
}: {
  snap: CockpitWorkflowSnapshot;
  leadsCreatedPeriod: number;
}) {
  const f = snap.funnel;
  const fn = (k: string) => f[k] ?? 0;
  const signed = fn("agreement_signed") + fn("paid");
  const sent = fn("agreement_sent") + signed + fn("lost");
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Nouveaux leads (période)"
        value={leadsCreatedPeriod.toLocaleString("fr-FR")}
        hint="Créations leads sur la même fenêtre que le funnel (périmètre d’accès)"
        icon={<Building2 className="size-4" />}
      />
      <StatCard
        title="Simulations validées"
        value={(fn("simulation_done") + fn("to_confirm") + fn("qualified")).toLocaleString("fr-FR")}
        hint="Pipeline post-simulation"
      />
      <StatCard
        title="Accords envoyés"
        value={fn("agreement_sent").toLocaleString("fr-FR")}
        hint="En attente signature client"
      />
      <StatCard
        title="Signés / payés"
        value={signed.toLocaleString("fr-FR")}
        hint={
          conversionRate(signed, sent) != null
            ? `Taux signature (envoyés+signés): ${conversionRate(signed, sent)} %`
            : "—"
        }
      />
    </div>
  );
}

export function CockpitNetworkCallout() {
  return (
    <Card className="border-dashed border-emerald-500/30 bg-emerald-500/5">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Radio className="size-4 text-emerald-600" />
        <CardTitle className="text-base">Réseau temps réel</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          Vue détaillée fiches → équipes → rôles :{" "}
          <Link href="/settings/roles" className="font-medium text-emerald-700 underline dark:text-emerald-400">
            Administration fiches CEE
          </Link>
        </CardDescription>
      </CardContent>
    </Card>
  );
}
