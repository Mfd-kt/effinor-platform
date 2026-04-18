import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { getLeadGenerationAutomationMetrics } from "@/features/lead-generation/analytics/get-lead-generation-automation-metrics";
import { getLeadGenerationConversionMetrics } from "@/features/lead-generation/analytics/get-lead-generation-conversion-metrics";
import { getLeadGenerationExecutionMetrics } from "@/features/lead-generation/analytics/get-lead-generation-execution-metrics";
import { getLeadGenerationImportMetrics } from "@/features/lead-generation/analytics/get-lead-generation-import-metrics";
import { getLeadGenerationStockMetrics } from "@/features/lead-generation/analytics/get-lead-generation-stock-metrics";
import { LeadGenerationAutomationMetricsTable } from "@/features/lead-generation/components/lead-generation-automation-metrics-table";
import { LeadGenerationMetricCard } from "@/features/lead-generation/components/lead-generation-metric-card";
import { LeadGenerationSourceMetricsTable } from "@/features/lead-generation/components/lead-generation-source-metrics-table";
import { LeadGenerationStatusBreakdown } from "@/features/lead-generation/components/lead-generation-status-breakdown";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationHub } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadGenerationAnalyticsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationHub(access))) {
    notFound();
  }

  const [imports, stock, execution, conversion, automation] = await Promise.all([
    getLeadGenerationImportMetrics(),
    getLeadGenerationStockMetrics(),
    getLeadGenerationExecutionMetrics(),
    getLeadGenerationConversionMetrics(),
    getLeadGenerationAutomationMetrics(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader
        title="Analytics Lead Generation"
        description="Vue synthétique acquisition, qualité du stock, exécution commerciale et conversion."
        actions={
          <Link href="/lead-generation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Retour Lead Generation
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Acquisition</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <LeadGenerationMetricCard label="Total imports" value={imports.totalImports} />
          <LeadGenerationMetricCard label="Imported" value={imports.importedCount} />
          <LeadGenerationMetricCard label="Accepted" value={imports.acceptedCount} />
          <LeadGenerationMetricCard label="Duplicates" value={imports.duplicateCount} />
          <LeadGenerationMetricCard label="Rejected" value={imports.rejectedCount} hint={`30j: ${imports.importsLast30Days} imports`} />
        </div>
        <LeadGenerationSourceMetricsTable rows={imports.bySource} />
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Imports récents</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {imports.recentImports.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <span className="font-mono">{row.source}</span>
                <span>{row.status}</span>
                <span>{new Date(row.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Qualité du stock</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <LeadGenerationMetricCard label="Total stock" value={stock.totalStock} />
          <LeadGenerationStatusBreakdown title="Stock status" items={stock.byStockStatus} />
          <LeadGenerationStatusBreakdown title="Qualification" items={stock.byQualificationStatus} />
          <LeadGenerationStatusBreakdown title="Dispatch queue" items={stock.byDispatchQueueStatus} />
          <LeadGenerationStatusBreakdown title="Priorité commerciale" items={stock.byCommercialPriority} />
          <LeadGenerationStatusBreakdown title="Confiance enrichissement" items={stock.byEnrichmentConfidence} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Exécution commerciale</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LeadGenerationMetricCard label="Total assignments" value={execution.totalAssignments} />
          <LeadGenerationMetricCard label="Assignments actifs" value={execution.activeAssignments} />
          <LeadGenerationMetricCard label="Assignments recyclés" value={execution.recycledAssignments} />
          <LeadGenerationMetricCard label="Activités commerciales" value={execution.totalActivities} />
          <LeadGenerationMetricCard label="Fiches avec activité" value={execution.assignmentsWithActivity} />
          <LeadGenerationMetricCard label="Fiches sans activité" value={execution.assignmentsWithoutActivity} />
          <LeadGenerationMetricCard label="Relances en retard" value={execution.overdueFollowUps} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Conversion</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LeadGenerationMetricCard label="Fiches converties en lead" value={conversion.totalConvertedStock} />
          <LeadGenerationMetricCard label="Taux stock → lead" value={`${conversion.conversionRatePct}%`} />
          <LeadGenerationMetricCard label="Conversions 7 derniers jours" value={conversion.convertedLast7Days} />
        </div>
        <LeadGenerationStatusBreakdown
          title="Conversions par source"
          items={conversion.bySource.map((x) => ({ key: x.source, count: x.converted }))}
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Conversions récentes</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {conversion.recentConversions.map((row) => (
              <li key={row.stockId} className="flex items-center justify-between gap-3">
                <span className="font-mono">{row.source}</span>
                <span>Stock {row.stockId.slice(0, 8)}…</span>
                <span>{new Date(row.convertedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Automatisations</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LeadGenerationMetricCard label="Total runs" value={automation.totalRuns} />
          <LeadGenerationMetricCard label="Runs 30 derniers jours" value={automation.runsLast30Days} />
          <LeadGenerationMetricCard
            label="Réussite récente"
            value={automation.byStatus.find((x) => x.key === "completed")?.count ?? 0}
          />
          <LeadGenerationMetricCard
            label="Échecs récents"
            value={automation.byStatus.find((x) => x.key === "failed")?.count ?? 0}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <LeadGenerationStatusBreakdown title="Runs par type" items={automation.byType} />
          <LeadGenerationStatusBreakdown title="Runs par status" items={automation.byStatus} />
        </div>
        <LeadGenerationAutomationMetricsTable rows={automation.recentRuns} />
        {automation.recentFailures.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Derniers échecs</h3>
            <ul className="mt-2 space-y-1 text-xs text-destructive">
              {automation.recentFailures.map((run) => (
                <li key={run.id}>
                  <span className="font-mono">{run.automation_type}</span> - {run.error_summary}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
