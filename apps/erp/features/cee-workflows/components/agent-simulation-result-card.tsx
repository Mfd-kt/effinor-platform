"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";
import { SimulatorProductCard } from "@/features/products/components/simulator-product-card";

function eur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function eurDetailed(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function num(value: number, digits = 0): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);
}

export function AgentSimulationResultCard({
  result,
  recommendedProduct,
}: {
  result: SimulatorComputedResult | null;
  recommendedProduct?: SimulatorProductCardViewModel | null;
}) {
  if (!result) {
    return (
      <Card className="border-dashed border-border/80">
        <CardHeader>
          <CardTitle>Résultat de simulation</CardTitle>
          <CardDescription>Le calcul apparaîtra ici dès que les paramètres de la fiche seront complets.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isPac = result.ceeSolution.solution === "PAC";
  const pac = result.pacSavings;

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Résultat instantané</CardTitle>
        <CardDescription>Lecture rapide pour argumenter au téléphone et qualifier le potentiel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPac && pac ? (
          <>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-950 dark:text-sky-100">
              <strong className="font-semibold">PAC air/eau (BAT-TH-163)</strong> — {result.ceeSolution.commercialMessage}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border bg-sky-50 px-4 py-3 dark:bg-sky-950/30">
                <div className="text-xs uppercase tracking-wide text-sky-700/80">Économie énergie (estim.)</div>
                <div className="mt-1 text-xl font-semibold text-sky-900 dark:text-sky-100">
                  {num(pac.annualEnergySavingsKwh)} kWh/an
                </div>
                <div className="text-xs text-muted-foreground">{num(pac.annualEnergySavingsPercent, 1)} %</div>
              </div>
              <div className="rounded-xl border bg-muted/40 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Conso. actuelle estimée</div>
                <div className="mt-1 text-xl font-semibold">{num(pac.currentConsumptionKwh)} kWh/an</div>
              </div>
              <div className="rounded-xl border bg-muted/40 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Conso. avec PAC</div>
                <div className="mt-1 text-xl font-semibold">{num(pac.pacConsumptionKwh)} kWh/an</div>
              </div>
              <div className="rounded-xl border bg-emerald-50 px-4 py-3 dark:bg-emerald-950/20">
                <div className="text-xs uppercase tracking-wide text-emerald-700/80">Économie budget (estim.)</div>
                <div className="mt-1 text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                  {pac.annualCostSavings != null ? eurDetailed(pac.annualCostSavings) : "—"}
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <strong className="text-foreground">Résumé :</strong> besoin utile chauffage ~{num(pac.annualUsefulHeatingNeedKwh)}{" "}
              kWh/an, rendement système actuel pris à {num(pac.currentEfficiency, 2)} (hypothèse). {pac.commercialMessage}
            </div>
          </>
        ) : isPac && !pac ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            Recommandation <strong>PAC air/eau</strong> — chiffrage détaillé indisponible : complétez les champs ou vérifiez
            les entrées. Estimation à confirmer par étude de dimensionnement.
          </div>
        ) : result.ceeSolution.solution === "NONE" ? (
          <div className="rounded-lg border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
            {result.ceeSolution.commercialMessage}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border bg-emerald-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-emerald-700/80">Économie estimée</div>
                <div className="mt-1 text-xl font-semibold text-emerald-800">{eur(result.savingEur30Selected)}</div>
              </div>
              <div className="rounded-xl border bg-sky-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-sky-700/80">Prime CEE</div>
                <div className="mt-1 text-xl font-semibold text-sky-800">{eur(result.ceePrimeEstimated)}</div>
              </div>
              <div className="rounded-xl border bg-amber-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-amber-700/80">Reste à charge</div>
                <div className="mt-1 text-xl font-semibold text-amber-800">{eur(Math.max(0, result.restToCharge))}</div>
              </div>
              <div className="rounded-xl border bg-violet-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-violet-700/80">Score</div>
                <div className="mt-1 text-xl font-semibold text-violet-800">{num(result.leadScore)}</div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Unités</div>
                <div className="mt-1 font-medium">{num(result.neededDestrat)}</div>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Puissance</div>
                <div className="mt-1 font-medium">{num(result.powerKw, 1)} kW</div>
              </div>
              <div className="rounded-lg border px-3 py-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">CO₂ évité</div>
                <div className="mt-1 font-medium">{num(result.co2SavedTons, 1)} t/an</div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <strong className="text-foreground">Résumé :</strong> environ {eur(result.savingEur30Selected)} d’économies
              annuelles, {eur(result.ceePrimeEstimated)} de prime estimée, {num(result.neededDestrat)} unité(s)
              recommandée(s) pour un reste à charge projeté à {eur(Math.max(0, result.restToCharge))}.
            </div>
          </>
        )}

        {recommendedProduct ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Produit recommandé</div>
            <SimulatorProductCard product={recommendedProduct} isRecommended />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
