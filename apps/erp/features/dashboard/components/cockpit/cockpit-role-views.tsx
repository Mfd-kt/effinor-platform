import { Suspense } from "react";

import { CeeNetworkOverview } from "@/features/cee-workflows/components/admin/cee-network-overview";
import { getAgentDashboardData } from "@/features/cee-workflows/queries/get-agent-dashboard-data";
import { getCloserDashboardData } from "@/features/cee-workflows/queries/get-closer-dashboard-data";
import { getConfirmateurDashboardData } from "@/features/cee-workflows/queries/get-confirmateur-dashboard-data";
import { DashboardAnalyticsCharts } from "@/features/dashboard/components/dashboard-analytics-charts";
import { DashboardPeriodOverview } from "@/features/dashboard/components/dashboard-period-overview";
import { CockpitAiInsightsSection } from "@/features/dashboard/ai-insights/components/cockpit-ai-insights";
import { getCockpitPeriodLabel } from "@/features/dashboard/lib/cockpit-period";
import type { CockpitBundle } from "@/features/dashboard/queries/get-cockpit-bundle";
import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";
import type { AccessContext } from "@/lib/auth/access-context";

import { CockpitRealtimeBoundary } from "./cockpit-realtime-boundary";
import {
  CockpitAlertSections,
  CockpitFunnelStrip,
  CockpitKpiBusinessRow,
  CockpitNetworkCallout,
  CockpitPageHeader,
  CockpitPriorityGrid,
  CockpitSection,
  CockpitSheetPerformanceTable,
} from "./cockpit-primitives";
import { CockpitScopeToolbar } from "./cockpit-toolbar";

function ToolbarFallback() {
  return (
    <div className="h-12 animate-pulse rounded-xl bg-muted/40" aria-hidden />
  );
}

function periodLabel(bundle: CockpitBundle) {
  return getCockpitPeriodLabel(bundle.filters.period);
}

export function CockpitAdminView({
  metrics,
  bundle,
}: {
  metrics: DashboardMetrics;
  bundle: CockpitBundle;
}) {
  const snap = bundle.snapshot;
  return (
    <CockpitRealtimeBoundary>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-8">
        <CockpitPageHeader
          eyebrow="Cockpit administrateur"
          title="Pilotage système & réseau CEE"
          subtitle="Vue consolidée : volumétrie, funnel, alertes opérationnelles et santé des équipes. Ajustez période et périmètre pour arbitrer."
        />
        <Suspense fallback={<ToolbarFallback />}>
          <CockpitScopeToolbar filters={bundle.filters} options={bundle.filterOptions} />
        </Suspense>

        <CockpitAlertSections
          periodAlerts={bundle.periodAlerts}
          structuralAlerts={bundle.structuralAlerts}
          periodLabel={periodLabel(bundle)}
        />

        <CockpitSection
          title="Vue d’ensemble (période)"
          description="Entonnoir commercial — workflows créés dans la fenêtre cockpit (même bornes que le sélecteur de période)."
        >
          <CockpitFunnelStrip funnel={snap.funnel} />
        </CockpitSection>

        <CockpitSection title="KPI transverses" description="Indicateurs leads & visites alignés sur la même période.">
          <CockpitKpiBusinessRow snap={snap} leadsCreatedPeriod={bundle.leadsCreatedInPeriod} />
          <div className="mt-4">
            <DashboardPeriodOverview metrics={metrics} />
          </div>
        </CockpitSection>

        <CockpitSection title="Performance par fiche CEE">
          <CockpitSheetPerformanceTable rows={snap.bySheet} />
        </CockpitSection>

        <CockpitSection
          title="Files & blocages"
          description="Dossiers créés sur la période et encore présents sur ces files (voir sous-titre des cartes)."
        >
          <CockpitPriorityGrid snap={snap} />
        </CockpitSection>

        {bundle.networkOverview ? (
          <CockpitSection title="Réseau temps réel" description="Volumes par statut mis à jour en direct (Supabase Realtime).">
            <CeeNetworkOverview initial={bundle.networkOverview} />
          </CockpitSection>
        ) : (
          <CockpitNetworkCallout />
        )}

        <CockpitSection title="Volume leads (période)">
          <DashboardAnalyticsCharts charts={metrics.charts} />
        </CockpitSection>
      </div>
    </CockpitRealtimeBoundary>
  );
}

export function CockpitDirectorView({
  metrics,
  bundle,
}: {
  metrics: DashboardMetrics;
  bundle: CockpitBundle;
}) {
  const snap = bundle.snapshot;
  return (
    <CockpitRealtimeBoundary>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-8">
        <CockpitPageHeader
          eyebrow="Direction commerciale"
          title="Performance & arbitrage"
          subtitle="Lisez les tendances, les goulots d’étranglement et les écarts par fiche. Orientez les équipes sans entrer dans le détail technique."
        />
        <Suspense fallback={<ToolbarFallback />}>
          <CockpitScopeToolbar filters={bundle.filters} options={bundle.filterOptions} />
        </Suspense>
        <CockpitAlertSections
          periodAlerts={bundle.periodAlerts}
          structuralAlerts={bundle.structuralAlerts}
          periodLabel={periodLabel(bundle)}
        />
        <CockpitSection title="IA — lecture business">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted/30" aria-hidden />}>
            <CockpitAiInsightsSection bundle={bundle} audience="director" />
          </Suspense>
        </CockpitSection>
        <CockpitSection title="Synthèse période">
          <CockpitFunnelStrip funnel={snap.funnel} />
          <div className="mt-4">
            <CockpitKpiBusinessRow snap={snap} leadsCreatedPeriod={bundle.leadsCreatedInPeriod} />
          </div>
        </CockpitSection>
        <CockpitSection title="Par fiche CEE">
          <CockpitSheetPerformanceTable rows={snap.bySheet} />
        </CockpitSection>
        <CockpitSection title="Canal d’acquisition (proxy centre / source)">
          {snap.byChannel.length === 0 ? (
            <p className="text-sm text-muted-foreground">Renseignez `lead_channel` sur les leads pour analyser les canaux.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Canal</th>
                    <th className="px-4 py-3 text-right">Dossiers</th>
                    <th className="px-4 py-3 text-right">Qualifiés+</th>
                    <th className="px-4 py-3 text-right">Signés</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.byChannel.map((c) => (
                    <tr key={c.channel} className="border-b border-border/50">
                      <td className="px-4 py-3 font-medium">{c.channel}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.workflowCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.qualifiedPlus}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.signed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CockpitSection>
        <CockpitSection title="Priorités terrain">
          <CockpitPriorityGrid snap={snap} />
        </CockpitSection>
        <DashboardPeriodOverview metrics={metrics} />
        <DashboardAnalyticsCharts charts={metrics.charts} />
      </div>
    </CockpitRealtimeBoundary>
  );
}


export async function CockpitAgentView({
  access,
  metrics,
  bundle,
}: {
  access: AccessContext;
  metrics: DashboardMetrics;
  bundle: CockpitBundle;
}) {
  if (access.kind !== "authenticated") return null;
  const agent = await getAgentDashboardData(access, bundle.periodRange);
  const snap = bundle.snapshot;
  return (
    <CockpitRealtimeBoundary fallbackPollMs={120_000}>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-8">
        <CockpitPageHeader
          eyebrow="Agent commercial"
          title="Actions & priorisation"
          subtitle="Files et funnel alignés sur la période sélectionnée dans la barre d’outils."
        />
        <Suspense fallback={<ToolbarFallback />}>
          <CockpitScopeToolbar filters={bundle.filters} options={bundle.filterOptions} />
        </Suspense>
        <CockpitSection title="Mes fiches">
          <div className="flex flex-wrap gap-2">
            {agent.sheets.map((s) => (
              <span
                key={s.id}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium"
              >
                {s.label}
              </span>
            ))}
          </div>
        </CockpitSection>
        <CockpitSection title="Entonnoir (workflows créés sur la période)">
          <CockpitFunnelStrip funnel={snap.funnel} />
        </CockpitSection>
        <CockpitSection title="Priorités">
          <CockpitPriorityGrid snap={snap} />
        </CockpitSection>
        <CockpitSection title="Brouillons & activité (période)">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-sm font-semibold">Brouillons</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{agent.activity.drafts.length}</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-sm font-semibold">Simulations validées (mises à jour dans la période)</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{agent.activity.validatedToday.length}</p>
            </div>
          </div>
        </CockpitSection>
        <DashboardPeriodOverview metrics={metrics} />
      </div>
    </CockpitRealtimeBoundary>
  );
}

export async function CockpitConfirmateurView({
  access,
  metrics,
  bundle,
}: {
  access: AccessContext;
  metrics: DashboardMetrics;
  bundle: CockpitBundle;
}) {
  if (access.kind !== "authenticated") return null;
  const data = await getConfirmateurDashboardData(access, bundle.periodRange);
  const snap = bundle.snapshot;
  return (
    <CockpitRealtimeBoundary>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-8">
        <CockpitPageHeader
          eyebrow="Confirmateur"
          title="Production & rigueur"
          subtitle="Stocks et funnel limités aux dossiers créés dans la période sélectionnée."
        />
        <Suspense fallback={<ToolbarFallback />}>
          <CockpitScopeToolbar filters={bundle.filters} options={bundle.filterOptions} />
        </Suspense>
        <CockpitAlertSections
          periodAlerts={bundle.periodAlerts}
          structuralAlerts={bundle.structuralAlerts}
          periodLabel={periodLabel(bundle)}
        />
        <CockpitFunnelStrip funnel={snap.funnel} />
        <CockpitSection title="Files confirmateur (période)">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">À confirmer</p>
              <p className="mt-2 text-2xl font-semibold">{data.queue.pending.length}</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Qualifiés</p>
              <p className="mt-2 text-2xl font-semibold">{data.queue.qualified.length}</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Docs prêts / à closer</p>
              <p className="mt-2 text-2xl font-semibold">{data.queue.docsReady.length}</p>
            </div>
          </div>
        </CockpitSection>
        <CockpitPriorityGrid snap={snap} />
        <DashboardPeriodOverview metrics={metrics} />
      </div>
    </CockpitRealtimeBoundary>
  );
}

export async function CockpitCloserView({
  access,
  metrics,
  bundle,
}: {
  access: AccessContext;
  metrics: DashboardMetrics;
  bundle: CockpitBundle;
}) {
  if (access.kind !== "authenticated") return null;
  const data = await getCloserDashboardData(access, bundle.periodRange);
  const snap = bundle.snapshot;
  return (
    <CockpitRealtimeBoundary>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-8">
        <CockpitPageHeader
          eyebrow="Closer"
          title="Signature & relances"
          subtitle="Pipeline limité aux workflows créés dans la période sélectionnée."
        />
        <Suspense fallback={<ToolbarFallback />}>
          <CockpitScopeToolbar filters={bundle.filters} options={bundle.filterOptions} />
        </Suspense>
        <CockpitAlertSections
          periodAlerts={bundle.periodAlerts}
          structuralAlerts={bundle.structuralAlerts}
          periodLabel={periodLabel(bundle)}
        />
        <CockpitFunnelStrip funnel={snap.funnel} />
        <CockpitSection title="Pipeline closer (période)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">À closer</p>
              <p className="mt-2 text-2xl font-semibold">{data.queue.pending.length}</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Signature</p>
              <p className="mt-2 text-2xl font-semibold">{data.queue.waitingSignature.length}</p>
            </div>
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Relances dues</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{data.queue.followUps.length}</p>
            </div>
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Signés / payés</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                {data.queue.signed.length}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Perdus</p>
              <p className="mt-2 text-2xl font-semibold text-amber-800 dark:text-amber-300">
                {data.queue.lost.length}
              </p>
            </div>
          </div>
        </CockpitSection>
        <CockpitPriorityGrid snap={snap} />
        <DashboardPeriodOverview metrics={metrics} />
      </div>
    </CockpitRealtimeBoundary>
  );
}
