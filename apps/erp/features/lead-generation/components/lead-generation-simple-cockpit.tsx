"use client";

import { Loader2, MapPin, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { autoDispatchLeadsAction } from "../actions/auto-dispatch-leads-action";
import { prepareLeadsAction } from "../actions/prepare-leads-action";
import { simpleCreateLeadsMapsAction } from "../actions/simple-create-leads-maps-action";
import {
  mergeGenerateCampaignConfig,
  readLastGenerateCampaignConfig,
  type GenerateCampaignStoredConfig,
} from "../lib/generate-campaign-storage";
import {
  humanizeSimpleCockpitStepError,
  readSimpleCockpitStorage,
  type SimpleCockpitStoredV1,
  summarizeCreateMapsForLastRun,
  summarizeDispatchForLastRun,
  summarizePrepareForLastRun,
  writeSimpleCockpitRun,
} from "../lib/simple-cockpit-ux";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";
import type { LeadGenerationCeeImportScope } from "../queries/get-lead-generation-cee-import-scope";
import { LeadGenerationGenerateCampaignModal } from "./lead-generation-generate-campaign-modal";

export type LeadGenerationSimpleCockpitMetrics = {
  totalStock: number;
  readyNow: number;
  enrichFirst: number;
  stockReady: number;
};

/** Une ligne par agent assignable : portefeuille (assignations actives en attente de traitement). */
export type LeadGenerationSimpleCockpitAgentRow = {
  id: string;
  displayName: string;
  activeStock: number;
};

type LeadGenerationSimpleCockpitProps = {
  metrics: LeadGenerationSimpleCockpitMetrics;
  agents?: LeadGenerationSimpleCockpitAgentRow[];
  ceeScope: LeadGenerationCeeImportScope;
};

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function LeadGenerationSimpleCockpit({ metrics, agents = [], ceeScope }: LeadGenerationSimpleCockpitProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyStep, setBusyStep] = useState<"create" | "prepare" | "dispatch" | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  /** Toujours `null` au 1er rendu (SSR = client) : le stockage local n’est lu qu’après montage pour éviter les erreurs d’hydratation. */
  const [stored, setStored] = useState<SimpleCockpitStoredV1 | null>(null);
  const [inlineError, setInlineError] = useState<{ step: "prepare" | "dispatch"; message: string } | null>(null);

  useEffect(() => {
    setStored(readSimpleCockpitStorage());
  }, []);

  const initialCampaignConfig: GenerateCampaignStoredConfig = mergeGenerateCampaignConfig(
    readLastGenerateCampaignConfig() ?? undefined,
  );

  const refreshStored = useCallback(() => {
    setStored(readSimpleCockpitStorage());
  }, []);

  const handleMapsLaunch = useCallback(
    async (payload: GenerateCampaignStoredConfig) => {
      const res = await simpleCreateLeadsMapsAction(payload);
      if (!res.ok) {
        return { ok: false as const, error: humanizeLeadGenerationActionError(res.error) };
      }
      writeSimpleCockpitRun("create", {
        at: new Date().toISOString(),
        acceptedCount: res.data.acceptedCount,
        coordinatorBatchId: res.data.coordinatorBatchId,
        mapsBatchId: res.data.mapsBatchId,
      });
      refreshStored();
      startTransition(() => router.refresh());
      return { ok: true as const };
    },
    [refreshStored, router],
  );

  function runPrepare() {
    if (pending || busyStep) return;
    setInlineError(null);
    setBusyStep("prepare");
    startTransition(async () => {
      const res = await prepareLeadsAction({});
      setBusyStep(null);
      if (!res.ok) {
        setInlineError({ step: "prepare", message: humanizeLeadGenerationActionError(res.error) });
        router.refresh();
        return;
      }
      writeSimpleCockpitRun("prepare", { ...res.data, at: new Date().toISOString() });
      refreshStored();
      router.refresh();
    });
  }

  function runDispatch() {
    if (pending || busyStep) return;
    setInlineError(null);
    setBusyStep("dispatch");
    startTransition(async () => {
      const res = await autoDispatchLeadsAction({});
      setBusyStep(null);
      if (!res.ok) {
        setInlineError({ step: "dispatch", message: humanizeSimpleCockpitStepError(res.error, "dispatch") });
        router.refresh();
        return;
      }
      writeSimpleCockpitRun("dispatch", { ...res.data, at: new Date().toISOString() });
      refreshStored();
      router.refresh();
    });
  }

  const last = stored?.runs;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-semibold">Créer des leads</CardTitle>
            </div>
            <CardDescription>
              Importer de nouvelles fiches depuis la carte — elles arrivent dans votre carnet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 text-sm">
            <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-muted-foreground">
              <p className="text-xs font-medium text-foreground">Carnet</p>
              <p className="mt-1">
                {metrics.totalStock} fiche{metrics.totalStock > 1 ? "s" : ""} au total
              </p>
            </div>
            {last?.create ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Dernier passage · </span>
                {formatShortDate(last.create.at)} — {summarizeCreateMapsForLastRun(last.create)}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Aucun passage enregistré sur cet appareil.</div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Button type="button" className="w-full" disabled={!!busyStep} onClick={() => setCreateModalOpen(true)}>
              Créer
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-semibold">Améliorer</CardTitle>
            </div>
            <CardDescription>
              Compléter les contacts, analyser les priorités et préparer la prise de rendez-vous.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 text-sm">
            <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-muted-foreground">
              <p className="text-xs font-medium text-foreground">À traiter / prêts</p>
              <p className="mt-1">
                {metrics.enrichFirst} à compléter avant appel · {metrics.readyNow} prêt
                {metrics.readyNow > 1 ? "s" : ""} maintenant
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Pour identifier les décideurs en masse, utilisez les actions dédiées dans{" "}
              <Link href="#lg-advanced-tools" className="font-medium text-foreground underline-offset-4 hover:underline">
                Outils avancés
              </Link>
              .
            </p>
            {last?.prepare ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Dernier passage · </span>
                {formatShortDate(last.prepare.at)} — {summarizePrepareForLastRun(last.prepare)}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Aucun passage enregistré sur cet appareil.</div>
            )}
            {inlineError?.step === "prepare" ? (
              <p className="rounded-md border border-destructive/25 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                {inlineError.message}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="pt-0">
            <Button
              type="button"
              className="w-full"
              variant="secondary"
              disabled={!!busyStep}
              onClick={runPrepare}
            >
              {busyStep === "prepare" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Traitement…
                </>
              ) : (
                "Améliorer"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Send className="size-4 shrink-0" aria-hidden />
              <CardTitle className="text-base font-semibold">Distribuer</CardTitle>
            </div>
            <CardDescription>
              Attribuer les fiches prêtes aux commerciaux, dans la limite de leur charge.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 text-sm">
            <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-muted-foreground">
              <p className="text-xs font-medium text-foreground">File commerciale</p>
              <p className="mt-1">
                {metrics.readyNow} prêt{metrics.readyNow > 1 ? "s" : ""} à attribuer (file « maintenant »)
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              <p className="text-xs font-medium text-foreground">Agents — leads actifs</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Fiches en portefeuille (en cours de traitement, résultat en attente).
              </p>
              {agents.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">Aucun agent commercial assignable.</p>
              ) : (
                <ul
                  className="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-xs text-muted-foreground"
                  aria-label="Liste des commerciaux et leads actifs"
                >
                  {agents.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 border-b border-border/30 pb-1.5 last:border-0 last:pb-0"
                    >
                      <span className="min-w-0 truncate text-foreground">{a.displayName}</span>
                      <span className="shrink-0 tabular-nums font-medium text-foreground">{a.activeStock}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {last?.dispatch ? (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Dernier passage · </span>
                {formatShortDate(last.dispatch.at)} — {summarizeDispatchForLastRun(last.dispatch)}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Aucun passage enregistré sur cet appareil.</div>
            )}
            {inlineError?.step === "dispatch" ? (
              <p className="rounded-md border border-destructive/25 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                {inlineError.message}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="pt-0">
            <Button type="button" className="w-full" variant="outline" disabled={!!busyStep} onClick={runDispatch}>
              {busyStep === "dispatch" ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Distribution…
                </>
              ) : (
                "Distribuer"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <LeadGenerationGenerateCampaignModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialConfig={initialCampaignConfig}
        onLaunch={handleMapsLaunch}
        ceeScope={ceeScope}
        variant="mapsOnly"
      />
    </div>
  );
}
