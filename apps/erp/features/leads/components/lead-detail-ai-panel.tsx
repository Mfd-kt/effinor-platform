import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LeadRow } from "@/features/leads/types";

type LeadDetailAiPanelProps = {
  lead: LeadRow;
};

/**
 * Champs IA : stockage uniquement, pas de calcul automatique dans l’app.
 */
export function LeadDetailAiPanel({ lead }: LeadDetailAiPanelProps) {
  const hasSummary = Boolean(lead.ai_lead_summary?.trim());
  const hasScore = lead.ai_lead_score != null;

  if (!hasSummary && !hasScore) {
    return null;
  }

  return (
    <Card className="mb-8 border-border shadow-sm">
      <CardHeader>
        <CardTitle>IA (lecture seule)</CardTitle>
        <CardDescription>
          Résumé et score issus d&apos;imports ou traitements externes — non modifiables ici.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSummary ? (
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Résumé</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{lead.ai_lead_summary}</p>
          </div>
        ) : null}
        {hasScore && lead.ai_lead_score != null ? (
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Score</p>
            <p className="mt-1 font-mono text-lg tabular-nums">
              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(lead.ai_lead_score)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
