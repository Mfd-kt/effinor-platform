import { getLeadGenerationAutomationMetrics } from "@/features/lead-generation/analytics/get-lead-generation-automation-metrics";
import { getLeadGenerationConversionMetrics } from "@/features/lead-generation/analytics/get-lead-generation-conversion-metrics";
import { getLeadGenerationExecutionMetrics } from "@/features/lead-generation/analytics/get-lead-generation-execution-metrics";
import { getLeadGenerationImportMetrics } from "@/features/lead-generation/analytics/get-lead-generation-import-metrics";
import { getLeadGenerationStockMetrics } from "@/features/lead-generation/analytics/get-lead-generation-stock-metrics";
import { LeadGenerationAgentPerformanceLeaderboard } from "@/features/lead-generation/components/lead-generation-agent-performance-leaderboard";
import { LeadGenerationAutomationMetricsTable } from "@/features/lead-generation/components/lead-generation-automation-metrics-table";
import { LeadGenerationMetricCard } from "@/features/lead-generation/components/lead-generation-metric-card";
import { LeadGenerationSourceMetricsTable } from "@/features/lead-generation/components/lead-generation-source-metrics-table";
import { LeadGenerationStatusBreakdown } from "@/features/lead-generation/components/lead-generation-status-breakdown";
import { getLeadGenerationAgentPerformanceLeaderboard } from "@/features/lead-generation/queries/get-lead-generation-agent-performance-leaderboard";

/** Sources legacy filtrées de l'affichage analytics (gardées en DB pour l'historique). */
const HIDDEN_SOURCES = new Set<string>(["apify_google_maps"]);

function isVisibleSource(source: string | null | undefined): boolean {
  if (!source) return true;
  return !HIDDEN_SOURCES.has(source);
}

function hasAnyValue(items: Array<{ count: number }>): boolean {
  return items.some((x) => x.count > 0);
}

/**
 * Vue analytics complète du module lead generation.
 *
 * Anciennement disponible à `/lead-generation/analytics` (page autonome),
 * désormais consolidée comme sous-vue de `/lead-generation/management?view=analytics`.
 *
 * Exécute en parallèle six requêtes serveur (acquisition, qualité du stock,
 * exécution commerciale, performance agents, conversion, automatisations).
 */
export async function LeadGenerationAnalyticsDashboard() {
  const [imports, stock, execution, conversion, automation, agentLeaderboard] = await Promise.all([
    getLeadGenerationImportMetrics(),
    getLeadGenerationStockMetrics(),
    getLeadGenerationExecutionMetrics(),
    getLeadGenerationConversionMetrics(),
    getLeadGenerationAutomationMetrics(),
    getLeadGenerationAgentPerformanceLeaderboard(),
  ]);

  const visibleSources = imports.bySource.filter((row) => isVisibleSource(row.source));
  const visibleConversionSources = conversion.bySource.filter((row) => isVisibleSource(row.source));

  const stockBreakdownsHaveData =
    hasAnyValue(stock.byStockStatus) ||
    hasAnyValue(stock.byQualificationStatus) ||
    hasAnyValue(stock.byDispatchQueueStatus) ||
    hasAnyValue(stock.byCommercialPriority) ||
    hasAnyValue(stock.byEnrichmentConfidence);

  const executionHasActivity =
    execution.totalAssignments > 0 ||
    execution.activeAssignments > 0 ||
    execution.recycledAssignments > 0 ||
    execution.totalActivities > 0 ||
    execution.assignmentsWithActivity > 0 ||
    execution.assignmentsWithoutActivity > 0 ||
    execution.overdueFollowUps > 0;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Acquisition</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <LeadGenerationMetricCard label="Total imports" value={imports.totalImports} />
          <LeadGenerationMetricCard label="Imported" value={imports.importedCount} />
          <LeadGenerationMetricCard label="Accepted" value={imports.acceptedCount} />
          <LeadGenerationMetricCard label="Duplicates" value={imports.duplicateCount} />
          <LeadGenerationMetricCard
            label="Rejected"
            value={imports.rejectedCount}
            hint={`30j: ${imports.importsLast30Days} imports`}
          />
        </div>
        <LeadGenerationSourceMetricsTable rows={visibleSources} />
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Imports récents</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {imports.recentImports
              .filter((row) => isVisibleSource(row.source))
              .map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <span className="font-mono">{row.source}</span>
                  <span>{row.status}</span>
                  <span>
                    {new Date(row.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Qualité du stock</h2>
        {stockBreakdownsHaveData ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <LeadGenerationMetricCard label="Total stock" value={stock.totalStock} />
            <LeadGenerationStatusBreakdown title="Stock status" items={stock.byStockStatus} />
            <LeadGenerationStatusBreakdown title="Qualification" items={stock.byQualificationStatus} />
            <LeadGenerationStatusBreakdown title="Dispatch queue" items={stock.byDispatchQueueStatus} />
            <LeadGenerationStatusBreakdown title="Priorité commerciale" items={stock.byCommercialPriority} />
            <LeadGenerationStatusBreakdown title="Confiance enrichissement" items={stock.byEnrichmentConfidence} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Qualité du stock</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Données en cours de consolidation — total stock : {stock.totalStock}.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Exécution commerciale</h2>
        {executionHasActivity ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LeadGenerationMetricCard label="Total assignments" value={execution.totalAssignments} />
            <LeadGenerationMetricCard
              label="Stock neuf (Nouveau)"
              value={execution.activeAssignments}
              hint="Seules les assignations au statut pipeline Nouveau — base plafond / réinjection."
            />
            <LeadGenerationMetricCard label="Assignments recyclés" value={execution.recycledAssignments} />
            <LeadGenerationMetricCard label="Activités commerciales" value={execution.totalActivities} />
            <LeadGenerationMetricCard label="Fiches avec activité" value={execution.assignmentsWithActivity} />
            <LeadGenerationMetricCard label="Fiches sans activité" value={execution.assignmentsWithoutActivity} />
            <LeadGenerationMetricCard label="Relances en retard" value={execution.overdueFollowUps} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Exécution commerciale</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Aucune activité commerciale agrégée pour le moment — les indicateurs apparaîtront dès les premières assignations.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Performance agents (pipeline)</h2>
        <p className="text-xs text-muted-foreground">
          Stock neuf, suivi (Contacté / À rappeler), retards SLA, plafond dynamique et suspension d’injection selon la charge.
        </p>
        <LeadGenerationAgentPerformanceLeaderboard rows={agentLeaderboard} />
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
          items={visibleConversionSources.map((x) => ({ key: x.source, count: x.converted }))}
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">Conversions récentes</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {conversion.recentConversions
              .filter((row) => isVisibleSource(row.source))
              .map((row) => (
                <li key={row.stockId} className="flex items-center justify-between gap-3">
                  <span className="font-mono">{row.source}</span>
                  <span>Stock {row.stockId.slice(0, 8)}…</span>
                  <span>
                    {new Date(row.convertedAt).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
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
