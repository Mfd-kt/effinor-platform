import type { LeadGenerationAutomationRunListItem } from "../queries/get-lead-generation-automation-runs";

function previewSummary(summary: Record<string, unknown>): string {
  if (typeof summary.totalScanned === "number") {
    return `${summary.totalScanned} lot(s) — ${String(summary.totalCompleted ?? 0)} terminé(s), ${String(summary.totalStillRunning ?? 0)} en cours, ${String(summary.totalFailed ?? 0)} en échec`;
  }
  if (typeof summary.totalRequested === "number") {
    const ok =
      typeof summary.totalSucceeded === "number"
        ? summary.totalSucceeded
        : typeof summary.totalScored === "number"
          ? summary.totalScored
          : "—";
    const fail = typeof summary.totalFailed === "number" ? summary.totalFailed : "—";
    const extra =
      typeof summary.totalEligible === "number" ? ` · éligibles : ${summary.totalEligible}` : "";
    return `${summary.totalRequested} demandé(s) · ok : ${ok} · échecs : ${fail}${extra}`;
  }
  const keys = Object.keys(summary);
  if (keys.length === 0) {
    return "—";
  }
  return JSON.stringify(summary).slice(0, 160);
}

export function LeadGenerationAutomationRunsList({ runs }: { runs: LeadGenerationAutomationRunListItem[] }) {
  if (runs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Aucun run enregistré pour l’instant (après migration et première exécution, l’historique apparaîtra ici).
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">Derniers runs (audit)</h3>
      <ul className="mt-2 divide-y divide-border">
        {runs.map((r) => (
          <li key={r.id} className="py-2 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] text-foreground">{r.automationType}</span>
              <span
                className={
                  r.status === "failed"
                    ? "text-destructive"
                    : r.status === "completed"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground"
                }
              >
                {r.status}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {new Date(r.createdAt).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "medium",
              })}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-foreground/90">{previewSummary(r.summary)}</p>
            {r.errorSummary ? (
              <p className="mt-1 text-[11px] text-destructive line-clamp-2">{r.errorSummary}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
