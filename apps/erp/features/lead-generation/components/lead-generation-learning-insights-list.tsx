import type { LeadGenerationLearningInsight } from "../learning/types";

const categoryLabel: Record<string, string> = {
  source_performance: "Performance source",
  scoring_quality: "Qualité scoring",
  enrichment_impact: "Impact enrichissement",
  operational_friction: "Frictions opérationnelles",
};

const severityClass: Record<string, string> = {
  warning: "text-amber-700 dark:text-amber-300",
  success: "text-emerald-700 dark:text-emerald-300",
  info: "text-muted-foreground",
};

export function LeadGenerationLearningInsightsList({ insights }: { insights: LeadGenerationLearningInsight[] }) {
  if (insights.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun insight disponible pour le moment.</p>;
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => (
        <article key={`${insight.category}-${idx}`} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {categoryLabel[insight.category] ?? insight.category}
            </p>
            <span className={`text-xs font-medium ${severityClass[insight.severity] ?? "text-muted-foreground"}`}>
              {insight.severity}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{insight.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{insight.summary}</p>
          <p className="mt-2 text-xs text-foreground">
            <span className="font-medium">Recommandation:</span> {insight.recommendation}
          </p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-2 text-[11px] text-muted-foreground">
            {JSON.stringify(insight.evidence, null, 2)}
          </pre>
        </article>
      ))}
    </div>
  );
}
