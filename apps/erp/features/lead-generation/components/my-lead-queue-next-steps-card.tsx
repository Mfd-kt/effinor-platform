import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import type { LeadGenerationAssignmentActivityListItem } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { formatDateTimeFr } from "@/lib/format";

type Props = {
  stock: LeadGenerationStockRow;
  activities: LeadGenerationAssignmentActivityListItem[];
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
 * Synthèse « que faire maintenant » pour la vue agent (sans jargon interne).
 */
export function MyLeadQueueNextStepsCard({ stock, activities }: Props) {
  const last = latestActivity(activities);
  const next = nextFutureFollowUp(activities);
  const overdue = hasOverdue(activities);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Que faire maintenant ?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {overdue ? (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-900 dark:text-amber-100">
            Une relance était prévue : pensez à rappeler ce contact.
          </p>
        ) : null}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Prochaine relance planifiée</p>
          <p>{next ? formatDateTimeFr(next) : "Aucune date — ajoutez-en dans l’activité."}</p>
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
            Piste utile : données enrichies ou vérifiées — adaptez votre discours en conséquence.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
