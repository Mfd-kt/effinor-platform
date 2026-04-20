"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reviewLeadGenerationStockAction } from "@/features/lead-generation/actions/review-lead-generation-stock-action";
import {
  MANUAL_REVIEW_DECISIONS_BY_TYPE,
  type LeadGenerationManualReviewDecision,
  type LeadGenerationManualReviewType,
} from "@/features/lead-generation/domain/manual-review";
import type { LeadGenerationManualReviewListItem } from "@/features/lead-generation/queries/get-lead-generation-manual-reviews";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { formatDateTimeFr } from "@/lib/format";

const TYPE_LABELS: Record<LeadGenerationManualReviewType, string> = {
  duplicate_review: "Doublon",
  dispatch_review: "File / dispatch",
  enrichment_review: "Enrichissement",
  stock_review: "Stock (réouverture / clôture)",
  quantifier_review: "Quantificateur",
  agent_return_review: "Renvoi commercial",
};

const DECISION_LABELS: Record<LeadGenerationManualReviewDecision, string> = {
  confirm_duplicate: "Confirmer le doublon",
  restore_from_duplicate: "Restaurer hors doublon",
  force_ready_now: "Forcer « Prêt maintenant »",
  force_review: "Forcer « À revoir »",
  force_do_not_dispatch: "Forcer « Ne pas diffuser »",
  confirm_verified_enrichment: "Confirmer les suggestions enrichies",
  reject_enrichment_suggestions: "Rejeter les suggestions",
  clear_enrichment_suggestions: "Vider les suggestions",
  reopen_stock: "Réouvrir la fiche",
  close_stock: "Clôturer / archiver la fiche",
  quantifier_qualify: "Qualifier (validée)",
  quantifier_out_of_target: "Hors cible (quantificateur)",
  commercial_return_to_quantification: "Retour quantification (commercial)",
};

type Props = {
  stockId: string;
  stock: LeadGenerationStockRow;
  reviews: LeadGenerationManualReviewListItem[];
  lastReviewerDisplayName: string | null;
};

export function LeadGenerationManualReviewPanel({
  stockId,
  stock,
  reviews,
  lastReviewerDisplayName,
}: Props) {
  const router = useRouter();
  const [reviewType, setReviewType] = useState<LeadGenerationManualReviewType>("dispatch_review");
  const [reviewDecision, setReviewDecision] = useState<LeadGenerationManualReviewDecision>("force_review");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allowedDecisions = useMemo(
    () => MANUAL_REVIEW_DECISIONS_BY_TYPE[reviewType],
    [reviewType],
  );

  function syncDecisionForType(nextType: LeadGenerationManualReviewType) {
    setReviewType(nextType);
    const first = MANUAL_REVIEW_DECISIONS_BY_TYPE[nextType][0];
    if (first) {
      setReviewDecision(first);
    }
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const res = await reviewLeadGenerationStockAction({
        stockId,
        reviewType,
        reviewDecision,
        reviewNotes: notes.trim() || null,
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage("Action enregistrée.");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Validation manuelle</CardTitle>
        <p className="text-xs font-normal text-muted-foreground">
          Décisions métier traçables (audit). Réservé au back-office.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {stock.manually_reviewed_at ? (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            <p className="text-xs font-medium text-muted-foreground">Dernière intervention manuelle</p>
            <p>
              {formatDateTimeFr(stock.manually_reviewed_at)}
              {lastReviewerDisplayName ? ` — ${lastReviewerDisplayName}` : null}
            </p>
            {stock.manual_override_status ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Statut : <span className="font-mono">{stock.manual_override_status}</span>
                {stock.manual_override_reason ? ` — ${stock.manual_override_reason}` : null}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune revue manuelle enregistrée sur cette fiche.</p>
        )}

        <div className="space-y-3 rounded-md border border-border bg-card p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lg-review-type">Type de revue</Label>
              <Select value={reviewType} onValueChange={(v) => syncDecisionForType(v as LeadGenerationManualReviewType)}>
                <SelectTrigger id="lg-review-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as LeadGenerationManualReviewType[])
                    .filter((t) => t !== "quantifier_review")
                    .map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lg-review-decision">Décision</Label>
              <Select
                value={reviewDecision}
                onValueChange={(v) => setReviewDecision(v as LeadGenerationManualReviewDecision)}
              >
                <SelectTrigger id="lg-review-decision">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedDecisions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DECISION_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lg-review-notes">Notes (optionnel)</Label>
            <Input
              id="lg-review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexte pour l’historique"
              maxLength={2000}
            />
          </div>
          <Button type="button" onClick={submit} disabled={pending}>
            Enregistrer la décision
          </Button>
          {message ? (
            <p className={`text-xs ${message.includes("enregistrée") ? "text-muted-foreground" : "text-destructive"}`}>
              {message}
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Historique (50 derniers)</p>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune entrée.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border text-sm">
              {reviews.map((r) => (
                <li key={r.id} className="space-y-1 px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{formatDateTimeFr(r.created_at)}</span>
                    <span className="text-xs text-muted-foreground">{r.reviewer_display_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[r.review_type]} · {DECISION_LABELS[r.review_decision]}
                  </p>
                  {r.review_notes ? <p className="text-xs">{r.review_notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
