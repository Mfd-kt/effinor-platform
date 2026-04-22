"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type {
  AutomationHealthLevel,
  CockpitHumanAnomaly,
  CommandCockpitAlertSeverity,
  CommandCockpitData,
  HotOpportunityRow,
} from "../types";
import { CockpitAiOrchestratorActivityCard } from "./cockpit-ai-orchestrator-activity";
import { CockpitAiRecommendations } from "./cockpit-ai-recommendations";
import { CockpitConvertButton } from "./cockpit-convert-button";

const FILTER_ALL = "__all__";
const STATUS_ALL = "__all__";
const STATUS_CB_OVERDUE = "__cb_overdue__";
const STATUS_CB_ACTIVE = "__cb_active__";
const STATUS_LEAD_HOT = "__lead_hot__";

const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function severityBorder(sev: CommandCockpitAlertSeverity): string {
  if (sev === "critical") return "ring-destructive/50 bg-destructive/5";
  if (sev === "warning") return "ring-amber-500/40 bg-amber-500/5";
  return "ring-muted-foreground/25 bg-muted/40";
}

function severityStyle(sev: CommandCockpitAlertSeverity): string {
  if (sev === "critical") return "text-destructive";
  if (sev === "warning") return "text-amber-700 dark:text-amber-400";
  return "text-muted-foreground";
}

function alertLevelLabel(sev: CommandCockpitAlertSeverity): string {
  if (sev === "critical") return "CRITIQUE";
  if (sev === "warning") return "IMPORTANT";
  return "INFO";
}

function anomalyLevelClasses(level: CockpitHumanAnomaly["level"]): string {
  if (level === "critique") return "ring-destructive/40 bg-destructive/5";
  return "ring-amber-500/35 bg-amber-500/5";
}

function healthClasses(h: AutomationHealthLevel): { pill: string; label: string } {
  if (h === "ok") {
    return {
      pill: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
      label: "OK",
    };
  }
  if (h === "partial") {
    return {
      pill: "bg-amber-500/15 text-amber-900 dark:text-amber-300",
      label: "Partiel",
    };
  }
  return {
    pill: "bg-destructive/15 text-destructive",
    label: "Problème",
  };
}

function matchesTeam(
  row: HotOpportunityRow,
  teamId: string,
  teamMembersByTeam: Record<string, string[]>,
): boolean {
  const members = teamMembersByTeam[teamId] ?? [];
  if (row.kind === "callback") {
    if (!row.assignedAgentUserId) return false;
    return members.includes(row.assignedAgentUserId);
  }
  if (row.teamId === teamId) return true;
  if (row.createdByAgentId && members.includes(row.createdByAgentId)) return true;
  return false;
}

function matchesSheet(row: HotOpportunityRow, sheetId: string): boolean {
  if (row.kind === "callback") return false;
  return row.sheetId === sheetId;
}

function matchesStatus(row: HotOpportunityRow, status: string): boolean {
  if (status === STATUS_ALL) return true;
  if (status === STATUS_CB_OVERDUE) return row.kind === "callback" && row.overdueCallback;
  if (status === STATUS_CB_ACTIVE) return row.kind === "callback";
  if (status === STATUS_LEAD_HOT) return row.kind === "lead" && row.statusLabel === "Simulateur rempli";
  return true;
}

function RowActions({ row }: { row: HotOpportunityRow }) {
  const tel = row.phone?.replace(/\s/g, "") ?? "";
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {tel ? (
        <a href={`tel:${tel}`} className={buttonVariants({ variant: "outline", size: "xs" })}>
          Appeler
        </a>
      ) : null}
      <Link href={row.href} className={buttonVariants({ variant: "default", size: "xs" })}>
        Ouvrir
      </Link>
      {row.kind === "callback" && row.canConvert ? (
        <CockpitConvertButton callbackId={row.id} size="xs" />
      ) : null}
    </div>
  );
}

type Props = {
  data: CommandCockpitData;
};

export function CommandCockpitShell({ data }: Props) {
  const [teamId, setTeamId] = useState(FILTER_ALL);
  const [sheetId, setSheetId] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);

  const filterCash = useMemo(() => {
    return data.cashImmediate.filter((row) => {
      if (teamId !== FILTER_ALL && !matchesTeam(row, teamId, data.teamMembersByTeam)) return false;
      if (sheetId !== FILTER_ALL && !matchesSheet(row, sheetId)) return false;
      if (!matchesStatus(row, statusFilter)) return false;
      return true;
    });
  }, [data.cashImmediate, data.teamMembersByTeam, teamId, sheetId, statusFilter]);

  const filterOpportunities = useMemo(() => {
    return data.opportunities.filter((row) => {
      if (teamId !== FILTER_ALL && !matchesTeam(row, teamId, data.teamMembersByTeam)) return false;
      if (sheetId !== FILTER_ALL && !matchesSheet(row, sheetId)) return false;
      if (!matchesStatus(row, statusFilter)) return false;
      return true;
    });
  }, [data.opportunities, data.teamMembersByTeam, teamId, sheetId, statusFilter]);

  const filterPipelineSamples = useMemo(() => {
    return data.pipeline.sampleBlocked.filter((s) => {
      if (teamId !== FILTER_ALL && s.teamId !== teamId) return false;
      if (sheetId !== FILTER_ALL && s.sheetId !== sheetId) return false;
      return true;
    });
  }, [data.pipeline.sampleBlocked, teamId, sheetId]);

  const convPct =
    data.callbacks.performance.conversionRate != null
      ? Math.round(data.callbacks.performance.conversionRate * 1000) / 10
      : null;

  const autoHealth = healthClasses(data.automation.health);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="Cockpit direction"
        description="Décisions, anomalies humaines, journal workflow — cash et équipe."
      />

      <CockpitAiRecommendations
        recommendations={data.aiRecommendations}
        heuristicOnly={data.aiRecommendationsMeta.heuristicOnly}
      />

      {data.aiOrchestratorActivity ? (
        <CockpitAiOrchestratorActivityCard activity={data.aiOrchestratorActivity} />
      ) : null}

      {data.internalSla ? (
        <Card className="ring-1 ring-sky-500/25">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-200">
              SLA internes
            </CardTitle>
            <CardDescription className="text-xs">
              Jalons métier (timezone {data.internalSla.timezone}) — résolus « aujourd’hui » = jour calendaire Paris.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-900 dark:text-amber-200">
                Alerte : {data.internalSla.totals.warning}
              </span>
              <span className="rounded-md bg-orange-500/10 px-2 py-1 text-orange-900 dark:text-orange-200">
                Dépassement : {data.internalSla.totals.breached}
              </span>
              <span className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">
                Critique : {data.internalSla.totals.critical}
              </span>
              <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                Résolus aujourd’hui : {data.internalSla.totals.resolvedTodayParis}
              </span>
            </div>
            {data.internalSla.worst.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune instance active hors « healthy ».</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2">Règle</th>
                      <th className="px-2 py-2">Objet</th>
                      <th className="px-2 py-2">Gravité</th>
                      <th className="px-2 py-2 tabular-nums">Retard (min)</th>
                      <th className="px-2 py-2 text-right">Lien</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.internalSla.worst.map((w) => (
                      <tr key={w.id} className="border-b border-border/80">
                        <td className="px-2 py-2">
                          <span className="font-medium">{w.ruleName}</span>
                          <span className="ml-1 text-xs text-muted-foreground">({w.ruleCode})</span>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {w.entityType} · <span className="font-mono text-[11px]">{w.entityId.slice(0, 8)}…</span>
                        </td>
                        <td className="px-2 py-2 uppercase text-xs">{w.status}</td>
                        <td className="px-2 py-2 tabular-nums">{w.minutesLate}</td>
                        <td className="px-2 py-2 text-right">
                          <Link href={w.href} className={buttonVariants({ variant: "outline", size: "xs" })}>
                            Ouvrir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Anomalies équipe</CardTitle>
          <CardDescription className="text-xs">Comportements humains — pas seulement des chiffres.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.humanAnomalies.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucune anomalie détectée sur les règles actuelles.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.humanAnomalies.map((h) => (
                <li
                  key={h.id}
                  className={cn("flex flex-col gap-2 p-3 ring-1 sm:flex-row sm:items-center sm:justify-between", anomalyLevelClasses(h.level))}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-bold uppercase text-muted-foreground">
                      {h.role} · {h.displayName}
                    </p>
                    <p className="text-sm font-medium leading-snug">{h.problem}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {h.level === "critique" ? "Niveau critique" : "Attention"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Link href={h.dossiersHref} className={buttonVariants({ variant: "secondary", size: "xs" })}>
                      Voir ses dossiers
                    </Link>
                    {h.email ? (
                      <a href={`mailto:${h.email}`} className={buttonVariants({ variant: "outline", size: "xs" })}>
                        Contacter
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[160px] flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Équipe</Label>
          <Select value={teamId} onValueChange={(v) => setTeamId(v ?? FILTER_ALL)}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Toutes les équipes</SelectItem>
              {data.filterOptions.teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px] flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Fiche CEE</Label>
          <Select value={sheetId} onValueChange={(v) => setSheetId(v ?? FILTER_ALL)}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Toutes les fiches</SelectItem>
              {data.filterOptions.sheets.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px] flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Statut / vue</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? STATUS_ALL)}>
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_ALL}>Tous</SelectItem>
              <SelectItem value={STATUS_CB_OVERDUE}>Rappels en retard</SelectItem>
              <SelectItem value={STATUS_CB_ACTIVE}>Rappels (actifs)</SelectItem>
              <SelectItem value={STATUS_LEAD_HOT}>Leads simulateur rempli</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="ring-1 ring-amber-500/30">
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Cash immédiat
          </CardTitle>
          <CardDescription className="text-xs">
            Tri : valeur estimée décroissante, puis score — max 10 (filtré côté client).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filterCash.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucune ligne dans les filtres.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Société</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 tabular-nums">Score</th>
                    <th className="px-3 py-2 tabular-nums">Valeur</th>
                    <th className="px-3 py-2">Statut</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterCash.map((o) => (
                    <tr key={`cash-${o.kind}-${o.id}`} className="border-b border-border/80">
                      <td className="px-3 py-2 font-medium">{o.company}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {o.kind === "callback" ? "Rappel" : "Lead"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{o.score}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {o.estimatedValueEur != null ? eur.format(o.estimatedValueEur) : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs">{o.statusLabel}</td>
                      <td className="px-3 py-2">
                        <RowActions row={o} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Alertes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-3">
          {data.alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte.</p>
          ) : (
            <ul className="space-y-2">
              {data.alerts.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-md p-2.5 ring-1 sm:flex-row sm:items-center sm:justify-between",
                    severityBorder(a.severity),
                  )}
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className={cn("flex items-center gap-1.5 text-[11px] font-bold", severityStyle(a.severity))}>
                      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                      {alertLevelLabel(a.severity)}
                    </p>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.message}</p>
                  </div>
                  <Link
                    href={a.href}
                    className={buttonVariants({
                      variant: a.severity === "critical" ? "destructive" : "outline",
                      size: "sm",
                    })}
                  >
                    {a.actionLabel}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Performance équipe</CardTitle>
          <CardDescription className="text-xs">
            7 j. · Médiane closer (logs) :{" "}
            {data.workflowLogMetrics.closerMedianHours != null
              ? `${data.workflowLogMetrics.closerMedianHours} h`
              : "—"}{" "}
            · Conv. créée→convertie :{" "}
            {data.workflowLogMetrics.conversionRateFromLogsPct != null
              ? `${data.workflowLogMetrics.conversionRateFromLogsPct} % (${data.workflowLogMetrics.conversionNumerator}/${data.workflowLogMetrics.conversionDenominator})`
              : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-3 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Agents</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[280px] text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Nom</th>
                    <th className="px-2 py-1.5 tabular-nums">J / S</th>
                    <th className="px-2 py-1.5 tabular-nums">Trait.</th>
                    <th className="px-2 py-1.5 tabular-nums">Conv.</th>
                    <th className="px-2 py-1.5 tabular-nums">%</th>
                    <th className="px-2 py-1.5 tabular-nums" title="Transitions workflow loggées (7 j.)">
                      Évts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.performance.agents.map((a) => (
                    <tr
                      key={a.userId}
                      className={cn(
                        "border-t border-border",
                        a.highlight === "top" && "bg-emerald-500/10",
                        a.highlight === "anomaly" && "bg-destructive/5",
                      )}
                    >
                      <td className="px-2 py-1.5 font-medium">{a.displayName}</td>
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                        {a.leadsCreatedDay}/{a.leadsCreatedWeek}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums">{a.callbacksTreatedWeek}</td>
                      <td className="px-2 py-1.5 tabular-nums">{a.callbacksConvertedWeek}</td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {a.conversionRatePct != null ? `${a.conversionRatePct}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{a.workflowTransitionsWeek}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Closers</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[280px] text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Nom</th>
                    <th className="px-2 py-1.5 tabular-nums">Pipe</th>
                    <th className="px-2 py-1.5 tabular-nums">Sign.</th>
                    <th className="px-2 py-1.5 tabular-nums">%</th>
                    <th className="px-2 py-1.5 tabular-nums">CA ~</th>
                    <th className="px-2 py-1.5 tabular-nums" title="Médiane globale (logs)">
                      Δ clos.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.performance.closers.map((c) => (
                    <tr
                      key={c.userId}
                      className={cn(
                        "border-t border-border",
                        c.highlight === "top" && "bg-emerald-500/10",
                        c.highlight === "anomaly" && "bg-amber-500/10",
                      )}
                    >
                      <td className="px-2 py-1.5 font-medium">{c.displayName}</td>
                      <td className="px-2 py-1.5 tabular-nums">{c.pipelineOpen}</td>
                      <td className="px-2 py-1.5 tabular-nums">{c.signedWeek}</td>
                      <td className="px-2 py-1.5 tabular-nums">
                        {c.signatureRatePct != null ? `${c.signatureRatePct}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 tabular-nums">{eur.format(c.caGeneratedWeekEur)}</td>
                      <td className="px-2 py-1.5 tabular-nums text-muted-foreground">
                        {c.medianHoursCloserStageFromLogs != null ? `${c.medianHoursCloserStageFromLogs} h` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Journal workflow (aperçu)</CardTitle>
          <CardDescription className="text-xs">Dernières transitions enregistrées — source fiable pour les métriques.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.workflowJournalPreview.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucun événement sur la fenêtre — appliquer la migration ou produire de l’activité.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-muted/80 text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1.5">Quand</th>
                    <th className="px-2 py-1.5">Événement</th>
                    <th className="px-2 py-1.5">Lead</th>
                    <th className="px-2 py-1.5">Statuts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workflowJournalPreview.map((line, i) => (
                    <tr key={`${line.at}-${line.leadId}-${i}`} className="border-t border-border">
                      <td className="px-2 py-1.5 whitespace-nowrap tabular-nums text-muted-foreground">
                        {new Date(line.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-2 py-1.5 font-mono">{line.eventType}</td>
                      <td className="px-2 py-1.5">
                        <Link href={`/leads/${line.leadId}`} className="underline-offset-2 hover:underline">
                          {line.leadId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">
                        {line.fromStatus ?? "—"} → {line.toStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Opportunités</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Société</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2 tabular-nums">Score</th>
                  <th className="px-3 py-2 tabular-nums">Valeur</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterOpportunities.map((o) => (
                  <tr key={`opp-${o.kind}-${o.id}`} className="border-b border-border/80">
                    <td className="px-3 py-2 font-medium">{o.company}</td>
                    <td className="px-3 py-2 text-muted-foreground">{o.kind === "callback" ? "Rappel" : "Lead"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{o.statusLabel}</td>
                    <td className="px-3 py-2 tabular-nums">{o.score}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {o.estimatedValueEur != null ? eur.format(o.estimatedValueEur) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <RowActions row={o} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Rappels commerciaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi
              label="Actifs"
              value={data.callbacks.kpis.dueToday + data.callbacks.kpis.overdue + data.callbacks.kpis.upcoming}
            />
            <Kpi label="Retard" value={data.callbacks.kpis.overdue} warn />
            <Kpi label="Aujourd’hui" value={data.callbacks.kpis.dueToday} />
            <Kpi label="Traités J" value={data.callbacks.kpis.completedToday} ok />
            <Kpi label="Conv. liste" value={convPct != null ? `${convPct} %` : "—"} />
          </div>
          <div className="grid gap-2 lg:grid-cols-3">
            <ShortList title="Retard" rows={data.callbacks.overdue} />
            <ShortList title="Critiques" rows={data.callbacks.critical} />
            <ShortList title="Haute valeur" rows={data.callbacks.highValue} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Sans agent" value={data.pipeline.unassignedAgent} warn={data.pipeline.unassignedAgent > 0} />
            <Kpi label="Att. closer" value={data.pipeline.awaitCloser} />
            <Kpi label="Bloqués (files)" value={data.pipeline.blockedCount} warn={data.pipeline.blockedCount > 0} />
          </div>
          <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <LatencyPill label="Âge m. closer" value={data.pipeline.stageLatency.awaitCloserAvgDays} warnAbove={7} />
            <LatencyPill label="Âge m. sans agent" value={data.pipeline.stageLatency.unassignedAvgDays} warnAbove={4} />
            <LatencyPill label="Âge m. bloqués" value={data.pipeline.stageLatency.blockedAvgDays} warnAbove={10} />
          </div>
          {data.pipeline.stageLatency.alerts.length > 0 ? (
            <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
              {data.pipeline.stageLatency.alerts.map((x) => (
                <li key={x.id}>
                  <Link href={x.href} className="underline-offset-2 hover:underline">
                    {x.message}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {filterPipelineSamples.length > 0 ? (
            <ul className="space-y-1.5">
              {filterPipelineSamples.map((s) => (
                <li
                  key={`${s.workflowId}-${s.leadId}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-2 py-1.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{s.companyName}</span>{" "}
                    <span className="text-xs text-muted-foreground">
                      {s.sheetLabel} · {s.status}
                    </span>
                  </span>
                  <Link href={`/leads/${s.leadId}`} className={buttonVariants({ variant: "outline", size: "xs" })}>
                    Ouvrir
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Automations</CardTitle>
          <CardDescription className="text-xs">
            {data.automation.windowHours}h · Slack échecs : {data.automation.slackFailed} · Emails (relances) échecs :{" "}
            {data.automation.emailFailed}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("rounded-full px-2 py-0.5 font-semibold", autoHealth.pill)}>{autoHealth.label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-medium",
                data.automation.cronHealthy
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              Cron 1h : {data.automation.cronHealthy ? "OK" : "échecs"}
            </span>
            <span className="text-muted-foreground">
              {data.automation.totalRuns} runs · {data.automation.failed} échecs · {data.automation.success} OK ·{" "}
              {data.automation.skipped} skip
            </span>
          </div>
          {data.automation.recentErrors.length > 0 ? (
            <ul className="max-h-32 space-y-1 overflow-y-auto font-mono text-[11px] text-destructive">
              {data.automation.recentErrors.slice(0, 5).map((e, i) => (
                <li key={`${e.at}-${i}`}>
                  {e.automationType} — {e.message ?? "erreur"}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3">
          <CardTitle className="text-sm font-semibold">Logs récents</CardTitle>
        </CardHeader>
        <CardContent className="max-h-48 overflow-y-auto pt-2">
          <ul className="space-y-1 font-mono text-[11px]">
            {data.logs.lines.map((l, i) => (
              <li
                key={`${l.at}-${i}`}
                className={cn(
                  "rounded border px-1.5 py-1",
                  l.severity === "critical" && "border-destructive/40 bg-destructive/5",
                  l.severity === "warning" && "border-amber-500/30 bg-amber-500/5",
                )}
              >
                {l.at} {l.label} — {l.detail}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  warn,
  ok,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
  ok?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border px-2 py-1.5",
        warn && "border-destructive/35 bg-destructive/5",
        ok && "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function LatencyPill({
  label,
  value,
  warnAbove,
}: {
  label: string;
  value: number | null;
  warnAbove: number;
}) {
  const show = value != null;
  const bad = show && value >= warnAbove;
  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5",
        bad ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-muted/20",
      )}
    >
      <span className="text-muted-foreground">{label} : </span>
      <span className="font-semibold tabular-nums">{show ? `${value} j` : "—"}</span>
    </div>
  );
}

function ShortList({
  title,
  rows,
}: {
  title: string;
  rows: {
    id: string;
    company: string;
    score: number;
    href: string;
    phone: string | null;
    canConvert: boolean;
  }[];
}) {
  return (
    <div className="rounded-md border border-border p-2">
      <p className="mb-1.5 text-xs font-semibold">{title}</p>
      {rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">—</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span>
                {r.company} <span className="text-muted-foreground">({r.score})</span>
              </span>
              <span className="flex gap-1">
                {r.phone ? (
                  <a href={`tel:${r.phone.replace(/\s/g, "")}`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
                    Appeler
                  </a>
                ) : null}
                <Link href={r.href} className={buttonVariants({ variant: "outline", size: "xs" })}>
                  Ouvrir
                </Link>
                {r.canConvert ? <CockpitConvertButton callbackId={r.id} size="xs" /> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
