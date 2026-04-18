"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { enrichLeadGenerationStockBatchAction } from "@/features/lead-generation/actions/enrich-lead-generation-stock-batch-action";
import { enrichLeadGenerationStockQuickAction } from "@/features/lead-generation/actions/enrich-lead-generation-stock-quick-action";
import { evaluateLeadGenerationDispatchQueueBatchAction } from "@/features/lead-generation/actions/evaluate-lead-generation-dispatch-queue-batch-action";
import { evaluateReadyLeadGenerationDispatchQueueQuickAction } from "@/features/lead-generation/actions/evaluate-ready-lead-generation-dispatch-queue-quick-action";
import { recalculateLeadGenerationCommercialScoreBatchAction } from "@/features/lead-generation/actions/recalculate-lead-generation-commercial-score-batch-action";
import { recalculateReadyLeadGenerationCommercialScoreQuickAction } from "@/features/lead-generation/actions/recalculate-ready-lead-generation-commercial-score-quick-action";
import { LeadGenerationDispatchAllButton } from "@/features/lead-generation/components/lead-generation-dispatch-all-button";
import { LeadGenerationStockSummaryStrip } from "@/features/lead-generation/components/lead-generation-stock-summary-strip";
import type { LeadGenerationListSearchState } from "@/features/lead-generation/lib/build-lead-generation-list-url";
import type {
  GetLeadGenerationStockFilters,
  LeadGenerationStockListItem,
} from "@/features/lead-generation/queries/get-lead-generation-stock";
import type { LeadGenerationStockSummary } from "@/features/lead-generation/queries/get-lead-generation-stock-summary";
import type { EvaluateLeadGenerationDispatchQueueBatchSummary } from "@/features/lead-generation/queue/evaluate-dispatch-queue";
import type { RecalculateLeadGenerationCommercialScoreBatchSummary } from "@/features/lead-generation/scoring/recalculate-lead-generation-commercial-score-batch";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";

import { LeadGenerationStockTable } from "./lead-generation-stock-table";

/** Sélection tableau : jusqu’à 100 (score commercial) ; enrichissement par lot de 100 côté action. */
const SELECTION_MAX = 100;
const ENRICH_BATCH_MAX = 100;

type Props = {
  rows: LeadGenerationStockListItem[];
  summary: LeadGenerationStockSummary;
  page: number;
  pageSize: number;
  /** Fiches attribuables (ready_now ∩ filtres liste). */
  readyPoolCount: number;
  linkBase: LeadGenerationListSearchState;
  activeStockChip?: string;
  activeDispatchChip?: string;
  dispatchFilters: GetLeadGenerationStockFilters | undefined;
};

export function LeadGenerationEnrichmentToolbar({
  rows,
  summary,
  page,
  pageSize,
  readyPoolCount,
  linkBase,
  activeStockChip,
  activeDispatchChip,
  dispatchFilters,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [commercialMessage, setCommercialMessage] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function formatCommercialScoreFeedback(s: RecalculateLeadGenerationCommercialScoreBatchSummary): string {
    if (s.totalRequested === 0) {
      return "Aucune fiche prête à scorer.";
    }
    if (s.totalFailed === 0) {
      return `${s.totalScored} fiche${s.totalScored > 1 ? "s" : ""} scorée${s.totalScored > 1 ? "s" : ""}.`;
    }
    if (s.totalScored === 0) {
      return `Aucune fiche scorée, ${s.totalFailed} en erreur.`;
    }
    return `${s.totalScored} fiche${s.totalScored > 1 ? "s" : ""} scorée${s.totalScored > 1 ? "s" : ""}, ${s.totalFailed} en erreur.`;
  }

  function formatQueueFeedback(s: EvaluateLeadGenerationDispatchQueueBatchSummary): string {
    if (s.totalRequested === 0) {
      return "Aucune fiche prête à classer dans la file.";
    }
    if (s.totalFailed === 0) {
      return `${s.totalSucceeded} fiche${s.totalSucceeded > 1 ? "s" : ""} classée${s.totalSucceeded > 1 ? "s" : ""} dans la file.`;
    }
    if (s.totalSucceeded === 0) {
      return `Aucune fiche classée, ${s.totalFailed} en erreur.`;
    }
    return `${s.totalSucceeded} fiche${s.totalSucceeded > 1 ? "s" : ""} classée${s.totalSucceeded > 1 ? "s" : ""}, ${s.totalFailed} en erreur.`;
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        if (next.size >= SELECTION_MAX) {
          return next;
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function runQuick() {
    setMessage(null);
    startTransition(async () => {
      const res = await enrichLeadGenerationStockQuickAction({});
      if (!res.ok) {
        setMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      const { processed, successes, failures } = res.data;
      setMessage(`Traitement : ${processed} fiche(s) · ${successes} réussie(s) · ${failures} échec(s).`);
      router.refresh();
    });
  }

  function runSelection() {
    setMessage(null);
    const ids = Array.from(selected).slice(0, ENRICH_BATCH_MAX);
    if (ids.length === 0) {
      setMessage("Cochez au moins une fiche.");
      return;
    }
    startTransition(async () => {
      const res = await enrichLeadGenerationStockBatchAction({ stockIds: ids });
      if (!res.ok) {
        setMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      const { processed, successes, failures } = res.data;
      setMessage(`Traitement : ${processed} fiche(s) · ${successes} réussie(s) · ${failures} échec(s).`);
      setSelected(new Set());
      router.refresh();
    });
  }

  function runScoreQuick() {
    setCommercialMessage(null);
    startTransition(async () => {
      const res = await recalculateReadyLeadGenerationCommercialScoreQuickAction({});
      if (!res.ok) {
        setCommercialMessage(res.error);
        return;
      }
      setCommercialMessage(formatCommercialScoreFeedback(res.data));
      if (res.data.totalRequested > 0) {
        router.refresh();
      }
    });
  }

  function runScoreSelection() {
    setCommercialMessage(null);
    const ids = Array.from(selected).slice(0, SELECTION_MAX);
    if (ids.length === 0) {
      setCommercialMessage("Cochez au moins une fiche dans le tableau.");
      return;
    }
    startTransition(async () => {
      const res = await recalculateLeadGenerationCommercialScoreBatchAction({ stockIds: ids });
      if (!res.ok) {
        setCommercialMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      setCommercialMessage(formatCommercialScoreFeedback(res.data));
      router.refresh();
    });
  }

  function runQueueQuick() {
    setQueueMessage(null);
    startTransition(async () => {
      const res = await evaluateReadyLeadGenerationDispatchQueueQuickAction({});
      if (!res.ok) {
        setQueueMessage(res.error);
        return;
      }
      setQueueMessage(formatQueueFeedback(res.data));
      if (res.data.totalRequested > 0) {
        router.refresh();
      }
    });
  }

  function runQueueSelection() {
    setQueueMessage(null);
    const ids = Array.from(selected).slice(0, SELECTION_MAX);
    if (ids.length === 0) {
      setQueueMessage("Cochez au moins une fiche dans le tableau.");
      return;
    }
    startTransition(async () => {
      const res = await evaluateLeadGenerationDispatchQueueBatchAction({ stockIds: ids });
      if (!res.ok) {
        setQueueMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      setQueueMessage(formatQueueFeedback(res.data));
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <LeadGenerationStockSummaryStrip
        summary={summary}
        page={page}
        pageSize={pageSize}
        rowCountOnPage={rows.length}
        linkBase={linkBase}
        activeStockChip={activeStockChip}
        activeDispatchChip={activeDispatchChip}
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Enrichissement des fiches</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Les suggestions d’enrichissement sont indicatives et doivent être vérifiées avant utilisation. La vérification
          « via le site » (fiche détail) utilise Firecrawl sur quelques pages publiques seulement. Aide commerciale
          heuristique : domaine / site / email suggérés sans modifier les sources. Fiches éligibles (téléphone + nom ;
          email ou site manquant ; pas rejet / doublon).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={runQuick} disabled={pending}>
            Enrichir les fiches sans email
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={runSelection} disabled={pending || selected.size === 0}>
            Enrichir la sélection ({selected.size})
          </Button>
        </div>
        {selected.size >= SELECTION_MAX ? (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">Sélection limitée à {SELECTION_MAX} fiches.</p>
        ) : null}
        {message ? <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{message}</p> : null}
        {selected.size > ENRICH_BATCH_MAX ? (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
            L’enrichissement traite au plus {ENRICH_BATCH_MAX} fiches (les premières cochées).
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Priorisation commerciale</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Calcul du score et de la priorité commerciale sur les fiches sélectionnées ou sur un lot de fiches « prêtes »
          (jamais scorées en priorité). Action manuelle : pas de calcul automatique en arrière-plan.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={runScoreQuick} disabled={pending}>
            Scorer les fiches prêtes
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={runScoreSelection}
            disabled={pending || selected.size === 0}
          >
            Recalculer le score de la sélection ({selected.size})
          </Button>
        </div>
        {commercialMessage ? (
          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{commercialMessage}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">File de dispatch</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Classe chaque fiche (prêt maintenant, enrichir avant, revoir, faible valeur, ne pas diffuser) à partir du
          score commercial et des données de contact. Action manuelle, sans traitement en masse automatique.
        </p>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={runQueueQuick} disabled={pending}>
              Évaluer les fiches prêtes
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={runQueueSelection}
              disabled={pending || selected.size === 0}
            >
              Évaluer la sélection ({selected.size})
            </Button>
          </div>
          <div className="min-w-[12rem] space-y-1 border-l border-border pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Distribution</p>
            <p className="text-xs text-muted-foreground">
              Jusqu’à 100 attributions par clic (réessayez pour la suite). Même périmètre que les filtres / le compteur
              ci-dessus.
            </p>
            <LeadGenerationDispatchAllButton readyPoolCount={readyPoolCount} dispatchFilters={dispatchFilters} />
          </div>
        </div>
        {queueMessage ? (
          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{queueMessage}</p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
          Aucune ligne sur cette page pour la sélection. L’enrichissement rapide cible tout de même les fiches
          « prêtes » sans email dans tout le stock (hors filtres de cette liste).
        </p>
      ) : (
        <LeadGenerationStockTable
          rows={rows}
          enrichmentSelection={{ selected, onToggle: toggleRow, max: SELECTION_MAX }}
        />
      )}
    </div>
  );
}
