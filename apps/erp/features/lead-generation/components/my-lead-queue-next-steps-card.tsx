import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import type { LeadGenerationAssignmentActivityListItem } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { leadPhoneToTelHref } from "@/features/leads/lib/lead-phone-tel";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type AnalysisProps = {
  stock: LeadGenerationStockRow;
  activities: LeadGenerationAssignmentActivityListItem[];
  /** Numéro pour affichage + lien tel (évite de dupliquer la carte Coordonnées). */
  phoneDisplay: string | null;
};

function latestActivity(activities: LeadGenerationAssignmentActivityListItem[]) {
  return activities[0];
}

function nextFutureFollowUp(activities: LeadGenerationAssignmentActivityListItem[]): string | null {
  const now = Date.now();
  let best: number | null = null;
  for (const a of activities) {
    if (!a.next_action_at) {
      continue;
    }
    const t = new Date(a.next_action_at).getTime();
    if (t < now) {
      continue;
    }
    if (best === null || t < best) {
      best = t;
    }
  }
  return best !== null ? new Date(best).toISOString() : null;
}

function hasOverdue(activities: LeadGenerationAssignmentActivityListItem[]): boolean {
  const now = Date.now();
  return activities.some((a) => a.next_action_at && new Date(a.next_action_at).getTime() < now);
}

/**
 * Synthèse « que faire maintenant » — bloc réutilisable (sans carte) pour la barre d’action en tête de page.
 */
export function MyLeadQueueAnalysisSummary({ stock, activities, phoneDisplay }: AnalysisProps) {
  const last = latestActivity(activities);
  const next = nextFutureFollowUp(activities);
  const overdue = hasOverdue(activities);
  const telHref = leadPhoneToTelHref(phoneDisplay);

  return (
    <div className="space-y-3 text-sm">
      {phoneDisplay ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Numéro</p>
          <p className="mt-0.5 font-medium tabular-nums">
            {telHref ? (
              <Link
                href={telHref}
                className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0 text-foreground")}
              >
                {phoneDisplay}
              </Link>
            ) : (
              phoneDisplay
            )}
          </p>
        </div>
      ) : null}
      {overdue ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-900 dark:text-amber-100">
          Une relance était prévue : pensez à rappeler ce contact.
        </p>
      ) : null}
      <div>
        <p className="text-xs font-medium text-muted-foreground">Prochaine relance planifiée</p>
        <p>{next ? formatDateTimeFr(next) : "Aucune — indiquez-la ci-dessous après l’appel."}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Dernière activité</p>
        <p>{last ? `${formatDateTimeFr(last.created_at)} — ${last.activity_label}` : "Aucune pour l’instant."}</p>
      </div>
      {stock.dispatch_queue_reason ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Priorisation</p>
          <p className="text-muted-foreground">{stock.dispatch_queue_reason}</p>
        </div>
      ) : null}
      {(stock.enrichment_status === "completed" && stock.enrichment_source === "firecrawl") ||
      (stock.email && stock.enrichment_confidence === "high") ? (
        <p className="text-xs text-muted-foreground">
          Données enrichies ou fiables — adaptez votre discours en conséquence.
        </p>
      ) : null}
    </div>
  );
}
