"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { DestratQuickSimulatorUi } from "@/features/leads/simulator/components/destrat-quick-simulator-ui";
import { computeLeadScore } from "@/features/leads/simulator/domain/simulator";
import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";
import { SimulatorProductCard } from "@/features/products/components/simulator-product-card";
import { DEFAULT_AGENT_DESTRAT_STATE, type AgentDestratFormState } from "@/features/cee-workflows/lib/agent-destrat-simulator";
import type { AgentSimulatorSheetContext } from "@/features/cee-workflows/lib/agent-simulator-registry";
import { resolveAgentSimulatorDefinition } from "@/features/cee-workflows/lib/agent-simulator-registry";

function eur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function num(value: number, digits = 0): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);
}

type Step2Synthesis = {
  savingEur: number;
  primeEur: number | null;
  restChargeEur: number | null;
  score: number;
};

export function AgentSheetSimulatorPanel({
  sheet,
  value,
  onChange,
  companyNameForScript,
  previewResult,
  recommendedProduct,
  destratFlowStep = 1,
  onDestratGoToStep2,
  onDestratResetSimulation,
  simulationDisabled,
}: {
  sheet: AgentSimulatorSheetContext;
  value: AgentDestratFormState;
  onChange: (next: AgentDestratFormState) => void;
  companyNameForScript?: string;
  previewResult: SimulatorComputedResult | null;
  recommendedProduct?: SimulatorProductCardViewModel | null;
  /** 1 = paramètres + estimation seuls ; 2 = synthèse prime / produit (après coordonnées prospect). */
  destratFlowStep?: 1 | 2;
  onDestratGoToStep2?: () => void;
  onDestratResetSimulation?: () => void;
  simulationDisabled?: boolean;
}) {
  const definition = resolveAgentSimulatorDefinition(sheet);

  const quickStepCopy = useMemo(() => {
    if (definition.kind !== "destrat") {
      return { title: "", description: "" };
    }
    const sol = previewResult?.ceeSolution?.solution;
    if (sol === "PAC") {
      return {
        title: "Simulation rapide — Pompe à chaleur air/eau",
        description:
          "Étape 1 — Saisie site et chauffage ; le moteur oriente vers la PAC BAT-TH-163 pour cet usage. Estimation et argumentaire ci-dessous.",
      };
    }
    if (sol === "NONE") {
      return {
        title: "Simulation rapide",
        description:
          "Étape 1 — Paramètres site et chauffage ; recommandation hors périmètre CEE avec les hypothèses actuelles.",
      };
    }
    return {
      title: "Simulation rapide",
      description:
        "Étape 1 — Paramètres site et chauffage (déstrat ou PAC selon éligibilité), estimation instantanée et script d'argumentaire.",
    };
  }, [definition.kind, previewResult?.ceeSolution?.solution]);

  const step2Synthesis = useMemo((): Step2Synthesis | null => {
    if (definition.kind !== "destrat" || !previewResult) return null;
    const isPac = previewResult.ceeSolution.solution === "PAC";
    if (isPac) {
      const savingEur = previewResult.pacSavings?.annualCostSavings ?? 0;
      return {
        savingEur,
        primeEur: null,
        restChargeEur: null,
        score: computeLeadScore({
          surfaceM2: previewResult.surfaceM2,
          heightM: previewResult.heightM,
          clientType: previewResult.clientType,
          saving30EuroSelected: savingEur,
          restToCharge: 0,
        }),
      };
    }
    return {
      savingEur: previewResult.savingEur30Selected,
      primeEur: previewResult.ceePrimeEstimated,
      restChargeEur: Math.max(0, previewResult.restToCharge),
      score: previewResult.leadScore,
    };
  }, [definition.kind, previewResult]);

  if (definition.kind !== "destrat") {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>{definition.title}</CardTitle>
          <CardDescription>{definition.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Simulateur indisponible"
            description="Vous pouvez enregistrer un brouillon prospect, mais la simulation métier de cette fiche n’est pas encore disponible."
            className="py-10"
          />
        </CardContent>
      </Card>
    );
  }

  const state = value ?? DEFAULT_AGENT_DESTRAT_STATE;

  if (destratFlowStep === 2) {
    return (
      <Card className="border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Synthèse après simulation</CardTitle>
          <CardDescription>
            {previewResult?.ceeSolution?.solution === "PAC"
              ? "Économie chauffage (PAC) et score prospect ; prime CEE et reste à charge après étude. Complétez les coordonnées puis enregistrez ou transmettez."
              : "Prime, score et produit recommandé — complétez les coordonnées ci-dessus puis enregistrez ou transmettez."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewResult && step2Synthesis ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
                  <div className="text-xs uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/90">Économie estimée</div>
                  <div className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{eur(step2Synthesis.savingEur)}</div>
                </div>
                <div className="rounded-xl border bg-sky-50 px-4 py-3 dark:bg-sky-950/30">
                  <div className="text-xs uppercase tracking-wide text-sky-700/80 dark:text-sky-300/90">Prime CEE</div>
                  <div className="mt-1 text-xl font-semibold text-sky-800 dark:text-sky-200">
                    {step2Synthesis.primeEur == null ? (
                      <span className="text-base font-medium text-sky-900/70 dark:text-sky-200/80">Après étude</span>
                    ) : (
                      eur(step2Synthesis.primeEur)
                    )}
                  </div>
                </div>
                <div className="rounded-xl border bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
                  <div className="text-xs uppercase tracking-wide text-amber-700/80 dark:text-amber-300/90">Reste à charge</div>
                  <div className="mt-1 text-xl font-semibold text-amber-800 dark:text-amber-200">
                    {step2Synthesis.restChargeEur == null ? (
                      <span className="text-base font-medium text-amber-900/70 dark:text-amber-200/80">Après étude</span>
                    ) : (
                      eur(step2Synthesis.restChargeEur)
                    )}
                  </div>
                </div>
                <div className="rounded-xl border bg-violet-50 px-4 py-3 dark:bg-violet-950/30">
                  <div className="text-xs uppercase tracking-wide text-violet-700/80 dark:text-violet-300/90">Score</div>
                  <div className="mt-1 text-xl font-semibold text-violet-800 dark:text-violet-200">{num(step2Synthesis.score)}</div>
                </div>
              </div>
              {recommendedProduct ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Produit recommandé</div>
                  <SimulatorProductCard product={recommendedProduct} isRecommended />
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun résultat de simulation — revenez à l&apos;étape 1 pour compléter les paramètres.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{quickStepCopy.title}</CardTitle>
        <CardDescription>{quickStepCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <DestratQuickSimulatorUi
          value={state}
          onChange={onChange}
          companyNameForScript={companyNameForScript ?? ""}
          disabled={simulationDisabled}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onDestratGoToStep2}
                disabled={!previewResult || simulationDisabled}
              >
                Continuer vers l&apos;étape 2
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onDestratResetSimulation}
                disabled={simulationDisabled}
              >
                Réinitialiser
              </Button>
              <p className="self-center text-xs text-muted-foreground">Simulation instantanée (mise à jour automatique)</p>
            </>
          }
        />
      </CardContent>
    </Card>
  );
}
