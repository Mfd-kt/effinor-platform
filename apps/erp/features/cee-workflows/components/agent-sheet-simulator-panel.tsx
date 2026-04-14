"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { DestratQuickSimulatorUi } from "@/features/leads/simulator/components/destrat-quick-simulator-ui";
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
          <CardDescription>Prime, score et produit recommandé — complétez les coordonnées ci-dessus puis enregistrez ou transmettez.</CardDescription>
        </CardHeader>
        <CardContent>
          {previewResult ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
                  <div className="text-xs uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/90">Économie estimée</div>
                  <div className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{eur(previewResult.savingEur30Selected)}</div>
                </div>
                <div className="rounded-xl border bg-sky-50 px-4 py-3 dark:bg-sky-950/30">
                  <div className="text-xs uppercase tracking-wide text-sky-700/80 dark:text-sky-300/90">Prime CEE</div>
                  <div className="mt-1 text-xl font-semibold text-sky-800 dark:text-sky-200">{eur(previewResult.ceePrimeEstimated)}</div>
                </div>
                <div className="rounded-xl border bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
                  <div className="text-xs uppercase tracking-wide text-amber-700/80 dark:text-amber-300/90">Reste à charge</div>
                  <div className="mt-1 text-xl font-semibold text-amber-800 dark:text-amber-200">{eur(Math.max(0, previewResult.restToCharge))}</div>
                </div>
                <div className="rounded-xl border bg-violet-50 px-4 py-3 dark:bg-violet-950/30">
                  <div className="text-xs uppercase tracking-wide text-violet-700/80 dark:text-violet-300/90">Score</div>
                  <div className="mt-1 text-xl font-semibold text-violet-800 dark:text-violet-200">{num(previewResult.leadScore)}</div>
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
        <CardTitle>Simulation rapide</CardTitle>
        <CardDescription>
          Étape 1 — Paramètres site et chauffage (déstrat ou PAC selon éligibilité), estimation instantanée et script
          d&apos;argumentaire.
        </CardDescription>
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
