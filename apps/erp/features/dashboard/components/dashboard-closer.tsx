import { ClipboardCheck, Flame, Phone, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";

import type { DashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";

import { DashboardAnalyticsCharts } from "@/features/dashboard/components/dashboard-analytics-charts";

import {
  DashboardCardTable,
  DashboardChrome,
  DashboardRecentLeadsTable,
  DashboardStatGrid,
} from "./dashboard-shared";
import { DashboardPeriodOverview } from "./dashboard-period-overview";

type Props = { metrics: DashboardMetrics };

export function DashboardCloser({ metrics }: Props) {
  return (
    <DashboardChrome
      title="Pipeline commercial"
      description="Vue complète — conversion lead → visite technique → installation."
    >
      <DashboardPeriodOverview metrics={metrics} />
      <DashboardAnalyticsCharts charts={metrics.charts} />
      <DashboardStatGrid>
        <StatCard
          title="Leads qualifiés"
          value={metrics.leadsQualified}
          hint="Prêts à avancer"
          icon={<Flame className="size-4" />}
        />
        <StatCard
          title="VT validées"
          value={metrics.vtValidated}
          hint="Transformation possible"
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard
          title="Leads convertis"
          value={metrics.leadsConverted}
          hint="Statut converti"
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          title="Rappels dus"
          value={metrics.leadsCallbackDue}
          hint="Callbacks à traiter"
          icon={<Phone className="size-4" />}
        />
      </DashboardStatGrid>

      <DashboardCardTable title="Leads chauds / récents">
        <DashboardRecentLeadsTable metrics={metrics} />
      </DashboardCardTable>
    </DashboardChrome>
  );
}
