import Link from "next/link";
import {
  BarChart3,
  Download,
  FileSignature,
  Receipt,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import { DashboardLayout, KpiGrid, DashboardSplitGrid } from "../shared/dashboard-layout";
import { KpiStatCard } from "../shared/kpi-stat-card";
import { AlertBannerStack } from "../shared/alert-banner";
import type { DashboardPeriod } from "../shared/types";

import { ChartCard } from "../widgets/chart-card";
import { FunnelChart } from "../widgets/funnel-chart";
import { TimelineChart, TimelineLegend } from "../widgets/timeline-chart";
import { SourceBreakdown, SourceBreakdownLegend } from "../widgets/source-breakdown";

import { getAdminOverviewKpis } from "./queries/get-admin-overview-kpis";
import { getAdminFunnel } from "./queries/get-admin-funnel";
import { getAdminTimeline } from "./queries/get-admin-timeline";
import { getAdminSources } from "./queries/get-admin-sources";
import { getAdminAlerts } from "./queries/get-admin-alerts";

const KPI_ICONS: Record<string, typeof Users> = {
  leads_created: Users,
  agreements_signed: FileSignature,
  vt_done: Wrench,
  premiums_paid: Receipt,
  conversion_rate: TrendingUp,
};

type Props = {
  period: DashboardPeriod;
};

/**
 * Cockpit système Admin / Super_admin.
 * Vue d'ensemble plateforme : KPIs, funnel global, évolution temporelle, sources, alertes.
 */
export async function AdminDashboard({ period }: Props) {
  const [overview, funnel, timeline, sources, alerts] = await Promise.all([
    getAdminOverviewKpis(period),
    getAdminFunnel(period),
    getAdminTimeline(period),
    getAdminSources(period),
    getAdminAlerts(),
  ]);

  const totalSources = sources.reduce((sum, s) => sum + s.value, 0);

  return (
    <DashboardLayout
      title="Cockpit système"
      description="Vue d'ensemble de la plateforme : leads, conversions, primes et santé opérationnelle."
      period={period}
      actions={
        <>
          <Link
            href="/lead-generation/imports"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download className="size-3.5" aria-hidden />
            Import LBC
          </Link>
          <Link
            href="/cockpit"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            <BarChart3 className="size-3.5" aria-hidden />
            Voir Analytics
          </Link>
        </>
      }
      alerts={<AlertBannerStack alerts={alerts} />}
    >
      <KpiGrid cols={5}>
        {overview.kpis.map((kpi) => (
          <KpiStatCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.display}
            sublabel={kpi.sublabel}
            icon={KPI_ICONS[kpi.key]}
            trend={kpi.trend}
            trendPolarity={kpi.trendPolarity}
          />
        ))}
      </KpiGrid>

      <DashboardSplitGrid
        primary={
          <ChartCard
            title="Funnel global"
            description="Stock → Qualifiés → RDV → Accords → VT → Installations → Primes"
            height={320}
          >
            <FunnelChart steps={funnel} />
          </ChartCard>
        }
        secondary={
          <ChartCard
            title="Sources d'acquisition"
            description="Répartition des leads entrants par canal"
            height={320}
          >
            <div className="grid h-full gap-4 sm:grid-cols-[1fr_auto] lg:grid-cols-1 lg:grid-rows-[1fr_auto]">
              <SourceBreakdown
                slices={sources}
                centerLabel={totalSources.toLocaleString("fr-FR")}
                centerSublabel="leads"
              />
              <SourceBreakdownLegend slices={sources} />
            </div>
          </ChartCard>
        }
      />

      <Card className="gap-3">
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm font-semibold">Évolution temporelle</CardTitle>
          <p className="text-xs text-muted-foreground">
            Leads créés, accords signés et dossiers signés sur la période sélectionnée.
          </p>
          <TimelineLegend series={timeline.series} />
        </CardHeader>
        <CardContent className="px-4">
          <div className="h-72 w-full min-w-0">
            <TimelineChart points={timeline.points} series={timeline.series} />
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
