"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { enrichLeadGenerationStockQuickAction } from "@/features/lead-generation/actions/enrich-lead-generation-stock-quick-action";
import { evaluateReadyLeadGenerationDispatchQueueQuickAction } from "@/features/lead-generation/actions/evaluate-ready-lead-generation-dispatch-queue-quick-action";
import { recalculateReadyLeadGenerationCommercialScoreQuickAction } from "@/features/lead-generation/actions/recalculate-ready-lead-generation-commercial-score-quick-action";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import type { EvaluateLeadGenerationDispatchQueueBatchSummary } from "@/features/lead-generation/queue/evaluate-dispatch-queue";
import type { RecalculateLeadGenerationCommercialScoreBatchSummary } from "@/features/lead-generation/scoring/recalculate-lead-generation-commercial-score-batch";

function formatCommercialScoreFeedback(s: RecalculateLeadGenerationCommercialScoreBatchSummary): string {
  if (s.totalRequested === 0) return "Aucune fiche prête à scorer pour l’instant.";
  if (s.totalFailed === 0) return `${s.totalScored} fiche${s.totalScored > 1 ? "s" : ""} scorée${s.totalScored > 1 ? "s" : ""}.`;
  if (s.totalScored === 0) return `Échec partiel : ${s.totalFailed} erreur(s).`;
  return `${s.totalScored} scorée(s), ${s.totalFailed} en erreur.`;
}

function formatQueueFeedback(s: EvaluateLeadGenerationDispatchQueueBatchSummary): string {
  if (s.totalRequested === 0) return "Rien à classer dans la file pour l’instant.";
  if (s.totalFailed === 0) return `${s.totalSucceeded} fiche${s.totalSucceeded > 1 ? "s" : ""} classée${s.totalSucceeded > 1 ? "s" : ""}.`;
  if (s.totalSucceeded === 0) return `Échec partiel : ${s.totalFailed} erreur(s).`;
  return `${s.totalSucceeded} classée(s), ${s.totalFailed} en erreur.`;
}

/**
 * Actions rapides « lot prêt » — la sélection par fiche reste sur la page Stock.
 */
export function LeadGenerationImproveLeadsPanel() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(kind: "enrich" | "score" | "dispatch") {
    setMsg(null);
    startTransition(async () => {
      if (kind === "enrich") {
        const res = await enrichLeadGenerationStockQuickAction({});
        if (!res.ok) {
          setMsg(humanizeLeadGenerationActionError(res.error));
          return;
        }
        const { processed, successes, failures } = res.data;
        setMsg(
          `Enrichissement : ${processed} traitée(s) · ${successes} réussie(s) · ${failures} échec(s).`,
        );
      } else if (kind === "score") {
        const res = await recalculateReadyLeadGenerationCommercialScoreQuickAction({});
        if (!res.ok) {
          setMsg(humanizeLeadGenerationActionError(res.error));
          return;
        }
        setMsg(formatCommercialScoreFeedback(res.data));
      } else {
        const res = await evaluateReadyLeadGenerationDispatchQueueQuickAction({});
        if (!res.ok) {
          setMsg(humanizeLeadGenerationActionError(res.error));
          return;
        }
        setMsg(formatQueueFeedback(res.data));
      }
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">Améliorer les leads</h2>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Actions sur tout le stock éligible. Pour cibler des fiches précises, ouvrez le stock complet.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-border/80 bg-transparent font-medium"
          disabled={pending}
          onClick={() => run("enrich")}
        >
          Compléter les contacts
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-border/80 bg-transparent font-medium"
          disabled={pending}
          onClick={() => run("score")}
        >
          Prioriser les meilleurs
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-border/80 bg-transparent font-medium"
          disabled={pending}
          onClick={() => run("dispatch")}
        >
          Préparer la distribution
        </Button>
      </div>
      {msg ? (
        <p className="mt-4 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
          {msg}
        </p>
      ) : null}
    </section>
  );
}

/** @deprecated alias — préférer LeadGenerationImproveLeadsPanel */
export const LeadGenerationOptimizationPanel = LeadGenerationImproveLeadsPanel;
