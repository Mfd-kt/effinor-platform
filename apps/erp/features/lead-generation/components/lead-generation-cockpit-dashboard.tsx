import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type { LeadGenerationCockpitData } from "../queries/load-lead-generation-cockpit";
import { LeadGenerationCockpitAgentTableClient } from "./lead-generation-cockpit-agent-table-client";

function fmtHours(h: number | null): string {
  if (h == null || Number.isNaN(h)) {
    return "—";
  }
  return `${h.toFixed(1)} h`;
}

function fmtDelta(n: number | null): string {
  if (n == null) {
    return "—";
  }
  if (n === 0) {
    return "Stable vs fenêtre précédente";
  }
  return n > 0 ? `+${n} vs fenêtre précédente` : `${n} vs fenêtre précédente`;
}

function healthStyles(status: LeadGenerationCockpitData["operationalHealth"]["status"]) {
  if (status === "sain") {
    return "border-emerald-500/40 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100";
  }
  if (status === "sous_tension") {
    return "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-50";
  }
  return "border-destructive/50 bg-destructive/10 text-destructive";
}

function healthLabel(status: LeadGenerationCockpitData["operationalHealth"]["status"]) {
  if (status === "sain") {
    return "Sain";
  }
  if (status === "sous_tension") {
    return "Sous tension";
  }
  return "Critique";
}

type KpiProps = {
  title: string;
  value: string | number;
  hint: string;
  href?: string;
  tone?: "default" | "amber" | "rose" | "emerald";
};

function KpiCard({ title, value, hint, href, tone = "default" }: KpiProps) {
  const body = (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        tone === "amber" && "border-amber-500/35 bg-amber-500/5",
        tone === "rose" && "border-rose-500/35 bg-rose-500/5",
        tone === "emerald" && "border-emerald-500/35 bg-emerald-500/5",
        tone === "default" && "border-border bg-card",
        href && "hover:border-primary/40 hover:bg-muted/40",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {body}
      </Link>
    );
  }
  return body;
}

export function LeadGenerationCockpitDashboard({ data }: { data: LeadGenerationCockpitData }) {
  const { summary, portfolioAging, velocity, operationalHealth, alerts, dispatchHealth, recentEvents, agentRows } =
    data;
  const periodLabel =
    data.filters.period === "24h" ? "24 h" : data.filters.period === "7d" ? "7 jours" : "30 jours";

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Vue d’ensemble</h2>
            <p className="text-xs text-muted-foreground">
              Stock neuf = pipeline « Nouveau » uniquement — aligné plafond / dispatch.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/lead-generation/my-queue" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              File commerciale
            </Link>
            <Link href="/lead-generation/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Analytics
            </Link>
            <Link href="/lead-generation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Stock
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard
            title="Stock neuf"
            value={summary.totalFreshStock}
            hint="À traiter en « Nouveau »"
            href="/lead-generation"
          />
          <KpiCard
            title="Suivi total"
            value={summary.totalPipelineFollowUp}
            hint="Contacté + À rappeler"
            href="/lead-generation/analytics"
          />
          <KpiCard
            title="SLA warning"
            value={summary.totalSlaWarning}
            hint="Échéances sous tension"
            tone="amber"
            href="/lead-generation/my-queue"
          />
          <KpiCard
            title="SLA dépassé"
            value={summary.totalSlaBreached}
            hint="Retards actifs"
            tone="rose"
            href="/lead-generation/my-queue"
          />
          <KpiCard
            title="Agents suspendus"
            value={summary.agentsSuspended}
            hint="Injection coupée (politique)"
            tone="amber"
          />
          <KpiCard
            title="Convertis"
            value={summary.leadsConvertedInSelectedPeriod}
            hint={`Période ${periodLabel} — ${fmtDelta(summary.leadsConvertedPeriodDelta)} · 24h: ${summary.leadsConvertedLast24h} · 7j: ${summary.leadsConvertedLast7d}`}
            tone="emerald"
            href="/lead-generation/analytics"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Santé opérationnelle</h2>
        <div
          className={cn(
            "rounded-xl border p-4 sm:p-5",
            healthStyles(operationalHealth.status),
          )}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">Statut global</p>
              <p className="mt-1 text-2xl font-semibold">{healthLabel(operationalHealth.status)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-6">
              <StatPill label="Part SLA dépassé / actif" value={`${(operationalHealth.shareBreached * 100).toFixed(1)} %`} />
              <StatPill label="Part suivi / actif" value={`${(operationalHealth.shareFollowUpPipeline * 100).toFixed(1)} %`} />
              <StatPill label="Agents sous pression" value={String(operationalHealth.agentsUnderPressure)} />
              <StatPill label="Top performers" value={String(operationalHealth.agentsTopPerformers)} />
            </div>
          </div>
          {operationalHealth.signals.length > 0 ? (
            <ul className="mt-4 space-y-1 border-t border-black/5 pt-4 text-xs dark:border-white/10">
              {operationalHealth.signals.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {alerts.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Top urgences</h2>
            <span className="text-xs text-muted-foreground">Actionnable immédiatement</span>
          </div>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm",
                  a.severity === "critical" && "border-destructive/40 bg-destructive/5",
                  a.severity === "warning" && "border-amber-500/40 bg-amber-500/5",
                  a.severity === "info" && "border-border bg-muted/30",
                )}
              >
                <p className="font-medium text-foreground">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Vieillissement du portefeuille</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <AgingCell label="Nouveau &lt; 2 h" value={portfolioAging.newUnder2h} ok />
          <AgingCell label="Nouveau &gt; 2 h" value={portfolioAging.newOver2h} warn={portfolioAging.newOver2h > 0} />
          <AgingCell label="Contacté &lt; 24 h" value={portfolioAging.contactedUnder24h} ok />
          <AgingCell
            label="Contacté &gt; 24 h"
            value={portfolioAging.contactedOver24h}
            warn={portfolioAging.contactedOver24h > 0}
          />
          <AgingCell label="Rappel dû aujourd’hui" value={portfolioAging.followUpDueToday} />
          <AgingCell label="Rappel en retard" value={portfolioAging.followUpOverdue} warn />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Vitesse de transformation</h2>
        <p className="text-xs text-muted-foreground">
          Jalons sur la période sélectionnée (assignations démarrant dans la fenêtre) — {velocity.milestonesSampleSize}{" "}
          assignation(s) analysée(s).
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Assignation → 1er contact" value={fmtHours(velocity.avgHoursAssignedToFirstContact)} />
          <MiniStat label="Assignation → conversion" value={fmtHours(velocity.avgHoursAssignedToConversion)} />
          <MiniStat label="1er contact → conversion" value={fmtHours(velocity.avgHoursFirstContactToConversion)} />
          <MiniStat label="1er contact &lt; 2 h (volume)" value={String(velocity.countFirstContactUnder2h)} />
          <MiniStat label="Conversion &lt; 24 h après assign." value={String(velocity.countConvertedUnder24hFromAssign)} />
          <MiniStat label="Conversions (journal / période)" value={String(velocity.conversionsInPeriod)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Équipe commerciale</h2>
        <p className="text-xs text-muted-foreground">Tri local — métriques live + période pour les flux.</p>
        <LeadGenerationCockpitAgentTableClient rows={agentRows} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Dispatch & alimentation</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Peuvent recevoir" value={String(dispatchHealth.agentsEligibleForInjection)} />
          <MiniStat label="Bloqués" value={String(dispatchHealth.agentsSuspended)} />
          <MiniStat label="Plafond moyen" value={String(dispatchHealth.avgEffectiveCap)} />
          <MiniStat label="Agents (sales)" value={String(dispatchHealth.agentsTotalSales)} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground">Injections (événements assigned)</p>
            <p className="mt-2 text-sm text-muted-foreground">
              24h : <span className="font-semibold text-foreground">{dispatchHealth.stockAssignedEventsLast24h}</span> · 7j
              :{" "}
              <span className="font-semibold text-foreground">{dispatchHealth.stockAssignedEventsLast7d}</span>
            </p>
            <p className="mt-3 text-xs font-semibold text-foreground">Blocages / reprises</p>
            <p className="mt-1 text-sm text-muted-foreground">
              dispatch_blocked — 24h : {dispatchHealth.dispatchBlockedEventsLast24h} · 7j :{" "}
              {dispatchHealth.dispatchBlockedEventsLast7d}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              dispatch_resumed — 24h : {dispatchHealth.dispatchResumedEventsLast24h} · 7j :{" "}
              {dispatchHealth.dispatchResumedEventsLast7d}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground">Motifs de blocage (7 jours)</p>
            {dispatchHealth.topBlockReasons.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Aucun motif agrégé.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {dispatchHealth.topBlockReasons.map((r) => (
                  <li key={r.reason} className="flex justify-between gap-3">
                    <span className="text-muted-foreground line-clamp-2">{r.reason}</span>
                    <span className="shrink-0 font-medium tabular-nums">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {dispatchHealth.recentDispatchTimeline.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold text-foreground">Derniers mouvements dispatch</p>
            <ul className="mt-3 space-y-2 text-xs">
              {dispatchHealth.recentDispatchTimeline.slice(0, 12).map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-foreground">{e.agentDisplayName}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.occurredAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="w-full text-muted-foreground">
                    <span className="font-mono text-[10px]">{e.eventType}</span> — {e.summary}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Flux récent</h2>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement sur la période.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Heure</th>
                  <th className="px-3 py-2 font-medium">Événement</th>
                  <th className="px-3 py-2 font-medium">Agent</th>
                  <th className="px-3 py-2 font-medium">Contexte</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((e) => (
                  <tr key={e.id} className="border-b border-border/70 last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {new Date(e.occurredAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{e.eventType}</td>
                    <td className="px-3 py-2">{e.agentDisplayName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.contextLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function AgingCell({
  label,
  value,
  ok,
  warn,
}: {
  label: string;
  value: number;
  ok?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        ok && "border-emerald-500/30 bg-emerald-500/5",
        warn && "border-amber-500/40 bg-amber-500/5",
        !ok && !warn && "border-border bg-card",
      )}
    >
      <p className="text-[10px] font-medium uppercase leading-tight text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
