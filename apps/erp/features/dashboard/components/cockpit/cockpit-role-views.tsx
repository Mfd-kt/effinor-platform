import { Suspense } from "react";

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
import { CommercialAgentPremiumDashboard } from "./commercial-agent-premium-dashboard";
import { CockpitScopeToolbar } from "./cockpit-toolbar";
import { getCommercialAgentCockpitData } from "@/features/dashboard/queries/get-commercial-agent-cockpit-data";

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

        <CockpitNetworkCallout />

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
  metrics: _metrics,
  bundle,
}: {
  access: AccessContext;
  metrics: DashboardMetrics;
  bundle: CockpitBundle;
}) {
  if (access.kind !== "authenticated") return null;
  const perf = await getCommercialAgentCockpitData(access, bundle.periodRange, bundle.filters);
  return (
    <CockpitRealtimeBoundary fallbackPollMs={120_000}>
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 lg:px-8">
        <CockpitPageHeader
          eyebrow="Mon cockpit"
          title="Vos résultats"
          subtitle="Votre performance commerciale sur la période — signé, perdu, pipeline et actions."
        />
        <Suspense fallback={<ToolbarFallback />}>
          <CockpitScopeToolbar
            filters={bundle.filters}
            options={bundle.filterOptions}
            variant="agent_personal"
          />
        </Suspense>
        {perf ? <CommercialAgentPremiumDashboard data={perf} /> : null}
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
        <CockpitPriorityGrid snap={snap} />
        <DashboardPeriodOverview metrics={metrics} />
      </div>
    </CockpitRealtimeBoundary>
  );
}
