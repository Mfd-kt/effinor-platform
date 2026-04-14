import { Building2, ClipboardCheck, ClipboardList, ListChecks } from "lucide-react";

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

export function DashboardConfirmer({ metrics }: Props) {
  return (
    <DashboardChrome
      title="Qualification & visites"
      description="Leads que vous confirmez et visites techniques liées."
    >
      <DashboardPeriodOverview metrics={metrics} />
      <DashboardAnalyticsCharts charts={metrics.charts} />
      <DashboardStatGrid>
        <StatCard
          title="Leads créés"
          value={metrics.leadsTotal}
          hint={`${metrics.periodLabel} · périmètre accès`}
          icon={<ListChecks className="size-4" />}
        />
        <StatCard
          title="VT à planifier"
          value={metrics.vtToSchedule}
          hint="Statut to_schedule"
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard
          title="Rapport en attente"
          value={metrics.vtReportPending}
          hint="report_pending"
          icon={<ClipboardList className="size-4" />}
        />
        <StatCard
          title="VT validées"
          value={metrics.vtValidated}
          hint="validated"
          icon={<Building2 className="size-4" />}
        />
      </DashboardStatGrid>

      <DashboardCardTable title="Leads récents">
        <DashboardRecentLeadsTable metrics={metrics} />
      </DashboardCardTable>
    </DashboardChrome>
  );
}
