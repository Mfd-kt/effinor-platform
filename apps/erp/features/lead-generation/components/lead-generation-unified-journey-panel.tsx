"use client";

import { Loader2, Route } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { UnifiedLeadGenerationPipelineResult } from "../services/run-unified-lead-generation-pipeline";
import { getDefaultGenerateCampaignConfig } from "../lib/generate-campaign";
import {
  mergeGenerateCampaignConfig,
  readLastGenerateCampaignConfig,
  type GenerateCampaignStoredConfig,
} from "../lib/generate-campaign-storage";
import {
  UNIFIED_PIPELINE_STEPS,
  type UnifiedPipelineStepKey,
  type UnifiedPipelineStepRecord,
} from "../services/unified-pipeline-state";
import { buildLeadGenerationStockLockedPipelineLotUrl } from "../lib/build-lead-generation-list-url";
import { LeadGenerationGenerateCampaignModal } from "./lead-generation-generate-campaign-modal";

const LOCK_MESSAGE =
  "Le dernier parcours a laissé des fiches du lot coordinateur sans email ou sans site web (téléphone présent). Complétez-les ou corrigez-les depuis le stock pour débloquer un nouveau parcours.";

const STEP_LABEL: Record<UnifiedPipelineStepKey, string> = {
  maps: "1. Carte (Google Maps)",
  yellow_pages: "2. Pages Jaunes",
  linkedin: "3. LinkedIn",
  improve: "4. Améliorer les fiches",
  dispatch: "5. Distribuer aux commerciaux",
};

type PipelineLock = {
  locked: boolean;
  blockingCount: number;
  coordinatorBatchId: string | null;
};

type Props = {
  pipelineLock: PipelineLock;
  assignableAgentsCount: number;
};

type ApiErrorBody = {
  ok?: false;
  error?: string;
  blocked?: boolean;
  blockedStep?: UnifiedPipelineStepKey;
  steps?: Record<string, UnifiedPipelineStepRecord>;
  warnings?: string[];
};

function stepBadgeClass(status: UnifiedPipelineStepRecord["status"]): string {
  switch (status) {
    case "completed":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100";
    case "running":
      return "border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100";
    case "failed":
    case "blocked":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "pending":
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function PipelineStepsReadout({
  steps,
  highlightKey,
}: {
  steps: Record<string, UnifiedPipelineStepRecord>;
  highlightKey?: UnifiedPipelineStepKey;
}) {
  return (
    <ol className="mt-2 space-y-2">
      {UNIFIED_PIPELINE_STEPS.map((key) => {
        const rec = steps[key];
        const status = rec?.status ?? "pending";
        const isHighlight = highlightKey === key;
        return (
          <li
            key={key}
            className={`flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${stepBadgeClass(status)} ${isHighlight ? "ring-2 ring-amber-500/50" : ""}`}
          >
            <span className="font-medium">{STEP_LABEL[key]}</span>
            <span className="text-xs uppercase tracking-wide opacity-80">{status}</span>
            {typeof rec?.count === "number" ? (
              <span className="text-xs opacity-90">· {rec.count} fiche(s)</span>
            ) : null}
            {rec?.message ? <span className="w-full text-xs opacity-90">{rec.message}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function LeadGenerationUnifiedJourneyPanel({ pipelineLock, assignableAgentsCount }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedInfo, setBlockedInfo] = useState<ApiErrorBody | null>(null);
  const [result, setResult] = useState<UnifiedLeadGenerationPipelineResult | null>(null);

  const initialConfig = useMemo(() => {
    const last = readLastGenerateCampaignConfig();
    return mergeGenerateCampaignConfig(last ?? getDefaultGenerateCampaignConfig());
  }, [modalOpen]);

  const onLaunch = useCallback(
    async (payload: GenerateCampaignStoredConfig) => {
      setError(null);
      setBlockedInfo(null);
      setResult(null);
      setRunning(true);
      try {
        const res = await fetch("/api/lead-generation/unified-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as UnifiedLeadGenerationPipelineResult | ApiErrorBody;
        if (!res.ok || !("ok" in json) || json.ok !== true) {
          const errBody = json as ApiErrorBody;
          const err =
            errBody && typeof errBody.error === "string" ? errBody.error : "Parcours interrompu.";
          setError(err);
          if (errBody?.blocked && errBody.steps) {
            setBlockedInfo(errBody);
          }
          return { ok: false as const, error: err };
        }
        setResult(json);
        router.refresh();
        return { ok: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur réseau.";
        setError(msg);
        return { ok: false as const, error: msg };
      } finally {
        setRunning(false);
      }
    },
    [router],
  );

  return (
    <section className="rounded-xl border border-border/80 bg-card/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Route className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight">Parcours automatique</h2>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Un seul lancement enchaîne dans l’ordre : carte, Pages Jaunes, LinkedIn, amélioration des fiches,
            puis distribution au lot — chaque étape doit se terminer avant la suivante.
          </p>
          <p className="text-xs text-muted-foreground">
            {assignableAgentsCount} commercial
            {assignableAgentsCount > 1 ? "aux" : ""} éligible
            {assignableAgentsCount > 1 ? "s" : ""} pour la répartition.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          className="shrink-0 gap-2"
          disabled={pipelineLock.locked || running}
          onClick={() => setModalOpen(true)}
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Parcours en cours…
            </>
          ) : (
            "Lancer le parcours"
          )}
        </Button>
      </div>

      {pipelineLock.locked ? (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          <p>{LOCK_MESSAGE}</p>
          {pipelineLock.blockingCount > 0 ? (
            <p className="text-xs opacity-90">{pipelineLock.blockingCount} fiche(s) concernée(s) sur ce lot.</p>
          ) : null}
          {pipelineLock.coordinatorBatchId ? (
            <Link
              href={buildLeadGenerationStockLockedPipelineLotUrl(pipelineLock.coordinatorBatchId)}
              className={`${buttonVariants({ variant: "secondary", size: "sm" })} inline-flex w-full justify-center sm:w-auto`}
            >
              Ouvrir ces fiches dans le stock
            </Link>
          ) : (
            <Link
              href="/lead-generation/stock?filtre=contact_gap"
              className={`${buttonVariants({ variant: "secondary", size: "sm" })} inline-flex w-full justify-center sm:w-auto`}
            >
              Ouvrir le stock (fiches à compléter)
            </Link>
          )}
        </div>
      ) : null}

      {running ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Les étapes s’enchaînent sur le serveur dans l’ordre imposé ; comptez plusieurs minutes (Apify).
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {blockedInfo?.steps ? (
        <div className="mt-4 space-y-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-3 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-medium">Parcours bloqué — état des étapes au moment de l’arrêt</p>
          <p className="text-xs opacity-90">
            Corrigez la cause (Imports / Apify) puis relancez. L’étape en échec est indiquée ci-dessous.
          </p>
          <PipelineStepsReadout steps={blockedInfo.steps} highlightKey={blockedInfo.blockedStep} />
          {blockedInfo.warnings && blockedInfo.warnings.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {blockedInfo.warnings.map((w, i) => (
                <li key={`${i}-${w.slice(0, 48)}`}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm">
          <p className="font-medium text-foreground">
            {result.pipelineStatus === "completed"
              ? "Parcours terminé"
              : result.pipelineStatus === "stopped"
                ? "Parcours terminé (limite métier)"
                : "Parcours terminé"}
          </p>
          {result.stopReason ? <p className="text-muted-foreground">{result.stopReason}</p> : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Détail des étapes</p>
            <PipelineStepsReadout steps={result.steps} />
          </div>
          {result.warnings.length > 0 ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-950 dark:text-amber-100">
              <p className="text-xs font-medium uppercase tracking-wide opacity-90">À vérifier (Apify / annuaire)</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
                {result.warnings.map((w, i) => (
                  <li key={`${i}-${w.slice(0, 48)}`}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
            <li>Fiches retenues sur le lot : {result.counts.generatedAccepted}</li>
            <li>Enrichies annuaire (mise à jour des fiches) : {result.counts.yellowPatched}</li>
            <li>Enrichies LinkedIn : {result.counts.linkedInUpdated}</li>
            <li>Améliorées (email / site / analyse) : {result.counts.improved}</li>
            <li>Prêtes à confier après amélioration : {result.counts.readyInLot}</li>
            <li>Distribuées aux équipes : {result.counts.distributed}</li>
            <li>Restantes à compléter (lot) : {result.counts.remainingToComplete}</li>
          </ul>
        </div>
      ) : null}

      <LeadGenerationGenerateCampaignModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialConfig={initialConfig}
        onLaunch={onLaunch}
      />
    </section>
  );
}
