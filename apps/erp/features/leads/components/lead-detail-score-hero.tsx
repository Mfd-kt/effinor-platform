import { cn } from "@/lib/utils";
import type { LeadRow } from "@/features/leads/types";

type LeadDetailScoreHeroProps = {
  lead: LeadRow;
  className?: string;
};

function scoreTone(score: number): string {
  if (score >= 71) return "border-emerald-500/40 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100";
  if (score >= 41) return "border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-50";
  return "border-rose-500/35 bg-rose-500/5 text-rose-950 dark:text-rose-50";
}

/**
 * Bandeau tout en haut : score IA + résumé court (données fiche lead).
 */
export function LeadDetailScoreHero({ lead, className }: LeadDetailScoreHeroProps) {
  const score = lead.ai_lead_score;
  const summary = lead.ai_lead_summary?.trim() ?? "";
  const hasScore = score != null && Number.isFinite(score);
  const hasAny = hasScore || Boolean(summary);

  if (!hasAny) {
    return (
      <div
        className={cn(
          "mb-6 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        <p className="font-medium text-foreground">Score IA</p>
        <p className="mt-1">
          Pas encore de score — ajoutez un enregistrement audio puis lancez{" "}
          <span className="text-foreground/90">Rédiger la note depuis l’audio (IA)</span>.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 rounded-xl border px-4 py-4 shadow-sm sm:flex-row sm:items-start sm:justify-between",
        hasScore ? scoreTone(score!) : "border-border bg-card",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score lead (IA)</p>
        {summary ? (
          <p className="text-sm leading-relaxed text-foreground/95">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Résumé CRM non renseigné.</p>
        )}
      </div>
      {hasScore ? (
        <div
          className={cn(
            "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-current/20 bg-background/80 font-mono text-3xl font-bold tabular-nums shadow-inner",
            score! >= 71
              ? "text-emerald-700 dark:text-emerald-300"
              : score! >= 41
                ? "text-amber-700 dark:text-amber-300"
                : "text-rose-700 dark:text-rose-300",
          )}
          title="Note 0 à 100 (qualité / exploitabilité du lead)"
        >
          {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(score!)}
        </div>
      ) : null}
    </div>
  );
}
