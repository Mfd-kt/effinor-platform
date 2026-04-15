"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isPacPreferredLocalUsage } from "@/features/leads/simulator/domain/cee-solution-decision";
import {
  computeSimulator,
  getAllowedDestratModelsForHeight,
  getSuggestedModel,
} from "@/features/leads/simulator/domain/simulator";
import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";
import { toAgentDestratSimulatorInput } from "@/features/leads/simulator/lib/agent-form-to-input";
import { BUILDING_TYPE_FROM_LOCAL_USAGE } from "@/features/leads/simulator/lib/local-usage-building-type";
import {
  CEE_BUILDING_TYPE_LABELS_FR,
  CEE_BUILDING_TYPE_VALUES,
  DESTRAT_CURRENT_HEATING_MODE_LABELS_FR,
  DESTRAT_CURRENT_HEATING_MODE_VALUES,
  DESTRAT_MODEL_VALUES,
  LOCAL_USAGE_LABELS_FR,
  LOCAL_USAGE_VALUES,
  normalizeSimulatorInput,
  SimulateLeadSchema,
} from "@/features/leads/simulator/schemas/simulator.schema";
import type { DestratAgentFormState } from "@/features/leads/simulator/types/destrat-agent-form-state";

function formatNumber(value: number, maxFractionDigits = 2): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: maxFractionDigits }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumericInput(raw: string, fallback: number): number {
  const parsed = Number(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildDestratCommercialScript(params: {
  companyName: string;
  siteProfileLabel: string;
  heatingLabel: string;
  result: SimulatorComputedResult;
  commercialRestToCharge: number;
  roiMonths: number | null;
}): string {
  const { companyName, siteProfileLabel, heatingLabel: hmLabel, result, commercialRestToCharge, roiMonths } = params;
  const target = companyName.trim() || "votre site";
  const roiText = roiMonths === null ? "rapide" : roiMonths <= 0 ? "immédiat" : `${Math.max(0, roiMonths)} mois`;
  const financingText =
    commercialRestToCharge <= 0
      ? "reste à charge 0 €"
      : `reste à charge estimé ${formatCurrency(commercialRestToCharge)}`;

  return `${target} — ${siteProfileLabel}, ${hmLabel} : environ ${formatCurrency(result.savingEur30Selected)} d'économies/an (${formatNumber(result.savingKwh30)} kWh) avec ${result.neededDestrat} destratificateurs. Coût chauffage estimé ${formatCurrency(result.costYearSelected)}/an, ROI ${roiText}, ${financingText}. ~${formatNumber(result.co2SavedTons, 3)} t CO₂ évitées/an.`;
}

export type DestratQuickSimulatorUiProps = {
  value: DestratAgentFormState;
  onChange: (next: DestratAgentFormState) => void;
  companyNameForScript?: string;
  footer?: ReactNode;
  disabled?: boolean;
};

export function DestratQuickSimulatorUi({
  value,
  onChange,
  companyNameForScript = "",
  footer,
  disabled = false,
}: DestratQuickSimulatorUiProps) {
  const form = value;

  function updateField<K extends keyof DestratAgentFormState>(key: K, nextValue: DestratAgentFormState[K]) {
    onChange({ ...form, [key]: nextValue });
  }

  function handleHeightChange(raw: string) {
    const parsed = parseNumericInput(raw, 5);
    const allowed = getAllowedDestratModelsForHeight(parsed);
    let nextModel = form.model;
    if (!form.model || !allowed.includes(form.model)) {
      nextModel = getSuggestedModel(parsed);
    } else if (parsed >= 7) {
      nextModel = "generfeu";
    }
    onChange({
      ...form,
      heightM: raw,
      model: nextModel,
    });
  }

  const hideHeightForUsage = isPacPreferredLocalUsage(form.localUsage);
  const leadInput = toAgentDestratSimulatorInput(form);
  const leadValidation = SimulateLeadSchema.safeParse(leadInput);
  const isHeatedYes = form.buildingHeated === "yes";
  const isHeatedNo = form.buildingHeated === "no";

  const previewResult: SimulatorComputedResult | null =
    isHeatedYes && leadValidation.success
      ? computeSimulator(normalizeSimulatorInput(leadValidation.data))
      : null;

  const heightSliderValue = hideHeightForUsage ? 5 : parseNumericInput(form.heightM, 5);
  const surfaceSliderValue = parseNumericInput(form.surfaceM2, 800);
  const commercialRestToCharge =
    previewResult && previewResult.ceeSolution.solution === "DESTRAT"
      ? Math.max(0, previewResult.restToCharge)
      : 0;
  const roiMonths =
    previewResult && previewResult.ceeSolution.solution === "DESTRAT" && previewResult.savingEur30Selected > 0
      ? Math.round((commercialRestToCharge / previewResult.savingEur30Selected) * 12)
      : null;

  const commercialScript =
    previewResult && previewResult.ceeSolution.solution === "DESTRAT"
      ? buildDestratCommercialScript({
          companyName: companyNameForScript,
          siteProfileLabel: form.localUsage
            ? LOCAL_USAGE_LABELS_FR[form.localUsage]
            : "—",
          heatingLabel: form.currentHeatingMode
            ? DESTRAT_CURRENT_HEATING_MODE_LABELS_FR[form.currentHeatingMode]
            : "—",
          result: previewResult,
          commercialRestToCharge,
          roiMonths,
        })
      : null;

  const allowedModels = getAllowedDestratModelsForHeight(heightSliderValue);

  const solution = previewResult?.ceeSolution.solution;
  const showDestratModel =
    isHeatedYes && (!previewResult || previewResult.ceeSolution.solution === "DESTRAT");

  return (
    <div className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section className="space-y-4">
          <div className="space-y-2">
            <Label>Bâtiment chauffé ? *</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => updateField("buildingHeated", "yes")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  form.buildingHeated === "yes"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/40",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                Oui
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => updateField("buildingHeated", "no")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  form.buildingHeated === "no"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border hover:bg-muted/40",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                Non
              </button>
            </div>
            {isHeatedNo ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Sans chauffage, les dispositifs CEE de ce simulateur ne s&apos;appliquent pas.
              </div>
            ) : null}
          </div>

          <fieldset disabled={!isHeatedYes || disabled} className={cn("space-y-4", (!isHeatedYes || disabled) && "opacity-60")}>
            <div className="space-y-2">
              <Label htmlFor="destrat-site-profile">Type et usage du bâtiment *</Label>
              <select
                id="destrat-site-profile"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.localUsage}
                onChange={(e) => {
                  const v = e.target.value as DestratAgentFormState["localUsage"];
                  if (isPacPreferredLocalUsage(v)) {
                    onChange({ ...form, localUsage: v, heightM: "5", model: "teddington_ds3" });
                  } else {
                    updateField("localUsage", v);
                  }
                }}
              >
                <option value="" disabled>
                  Sélectionner…
                </option>
                {CEE_BUILDING_TYPE_VALUES.map((bt) => {
                  const usages = LOCAL_USAGE_VALUES.filter((u) => BUILDING_TYPE_FROM_LOCAL_USAGE[u] === bt);
                  return (
                    <optgroup key={bt} label={CEE_BUILDING_TYPE_LABELS_FR[bt]}>
                      {usages.map((opt) => (
                        <option key={opt} value={opt}>
                          {LOCAL_USAGE_LABELS_FR[opt]}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destrat-current-heating">Mode de chauffage actuel : *</Label>
              <select
                id="destrat-current-heating"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.currentHeatingMode}
                onChange={(e) =>
                  updateField("currentHeatingMode", e.target.value as DestratAgentFormState["currentHeatingMode"])
                }
              >
                <option value="" disabled>
                  Sélectionner…
                </option>
                {DESTRAT_CURRENT_HEATING_MODE_VALUES.map((opt) => (
                  <option key={opt} value={opt}>
                    {DESTRAT_CURRENT_HEATING_MODE_LABELS_FR[opt]}
                  </option>
                ))}
              </select>
            </div>

            {showDestratModel ? (
              <div className="space-y-2">
                <Label>Modèle de destratificateur (si éligible déstrat)</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DESTRAT_MODEL_VALUES.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={!allowedModels.includes(opt)}
                      onClick={() => {
                        if (!allowedModels.includes(opt)) return;
                        updateField("model", opt);
                      }}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        form.model === opt ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/40",
                        !allowedModels.includes(opt) && "cursor-not-allowed opacity-40 hover:bg-transparent",
                      )}
                    >
                      <p className="font-semibold">{opt.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        Brassage ={" "}
                        {formatNumber(opt === "teddington_ds3" ? 2330 : opt === "teddington_ds7" ? 6500 : 10000, 0)} m³/h
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : isHeatedYes && previewResult ? (
              <p className="text-sm text-muted-foreground">
                {previewResult.ceeSolution.solution === "PAC" && hideHeightForUsage
                  ? "Pour ce type d'usage, nous orientons vers une pompe à chaleur air/eau (BAT-TH-163). Seule la surface chauffée est à renseigner."
                  : previewResult.ceeSolution.solution === "PAC"
                    ? "Usage non éligible à la déstratification d'air (ex. logistique / stockage) : seule une PAC — BAT-TH-163 — est proposée."
                    : "Déstratification d'air non proposée pour cette configuration."}
              </p>
            ) : null}

            <div className={cn("grid gap-3", hideHeightForUsage ? "" : "md:grid-cols-2")}>
              {!hideHeightForUsage ? (
                <div className="space-y-2">
                  <Label htmlFor="destrat-height">Hauteur sous plafond (m) *</Label>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Réglage à la souris</span>
                    <span className="font-medium">{heightSliderValue.toFixed(1)} m</span>
                  </div>
                  <input
                    id="destrat-height"
                    type="range"
                    min={2.5}
                    max={15}
                    step={0.1}
                    value={heightSliderValue}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Min 2,5 m</span>
                    <span>8,75 m</span>
                    <span>Max 15 m</span>
                  </div>
                </div>
              ) : null}
              <div className={cn("space-y-2", hideHeightForUsage && "md:col-span-2")}>
                <Label htmlFor="destrat-surface">Surface chauffée (m²) *</Label>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Réglage à la souris</span>
                  <span className="font-medium">{Math.round(surfaceSliderValue)} m²</span>
                </div>
                <input
                  id="destrat-surface"
                  type="range"
                  min={800}
                  max={10000}
                  step={50}
                  value={surfaceSliderValue}
                  onChange={(e) => updateField("surfaceM2", e.target.value)}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>800m²</span>
                  <span>5 000m²</span>
                  <span>10 000m²</span>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="destrat-consigne">Consigne commerciale / référence</Label>
                <Input
                  id="destrat-consigne"
                  value={form.consigne}
                  onChange={(e) => updateField("consigne", e.target.value)}
                  placeholder="Référence interne"
                />
              </div>
            </div>
          </fieldset>
        </section>

        <section className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Recommandation CEE</h3>
          </div>
          {!previewResult ? (
            <p className="text-sm text-muted-foreground">
              Renseignez les champs obligatoires : la recommandation unique (déstrat, PAC ou hors périmètre) s&apos;affiche
              automatiquement.
            </p>
          ) : solution === "DESTRAT" ? (
            <>
              <div className="rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Déstratification {previewResult.ceeSolution.destratCeeSheetCode ?? "BAT-TH-142"}
                </p>
                <p className="mt-2 text-sm text-emerald-900 dark:text-emerald-200">{previewResult.ceeSolution.commercialMessage}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Économies estimées</p>
                <p className="mt-1 text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                  {formatCurrency(previewResult.savingEur30Selected)} / an
                </p>
                <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  ROI estimé : {roiMonths === null ? "—" : `${Math.max(0, roiMonths)} mois`}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Volume</dt>
                  <dd>{formatNumber(previewResult.volumeM3)} m³</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Nb destratificateurs</dt>
                  <dd>{previewResult.neededDestrat}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Besoin en chauffage</dt>
                  <dd>{formatNumber(previewResult.powerKw, 2)} kW</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Coût annuel estimé</dt>
                  <dd>{formatCurrency(previewResult.costYearSelected)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reste à charge</dt>
                  <dd
                    className={cn(
                      previewResult.restToCharge > 0
                        ? "font-bold text-red-600 dark:text-red-400"
                        : "font-medium text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {formatCurrency(commercialRestToCharge)}
                  </dd>
                </div>
              </dl>
              {commercialScript ? (
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Script commercial</p>
                  <p className="text-sm leading-relaxed text-foreground">{commercialScript}</p>
                </div>
              ) : null}
            </>
          ) : solution === "PAC" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-sky-600/30 bg-sky-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
                  Pompe à chaleur air/eau — BAT-TH-163
                </p>
                <p className="mt-2 text-sm text-sky-900 dark:text-sky-100">{previewResult.ceeSolution.commercialMessage}</p>
                <p className="mt-3 text-xs text-muted-foreground">{previewResult.ceeSolution.reason}</p>
              </div>
              {previewResult.pacSavings ? (
                <div className="rounded-lg border border-sky-500/20 bg-background/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-900 dark:text-sky-100">
                    Estimation théorique PAC (hypothèses prudents)
                  </p>
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Besoin chauffage utile / an</dt>
                      <dd>{formatNumber(previewResult.pacSavings.annualUsefulHeatingNeedKwh, 0)} kWh</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Conso. actuelle estimée</dt>
                      <dd>{formatNumber(previewResult.pacSavings.currentConsumptionKwh, 0)} kWh</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Conso. avec PAC (SCOP)</dt>
                      <dd>{formatNumber(previewResult.pacSavings.pacConsumptionKwh, 0)} kWh</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Économie énergie / an</dt>
                      <dd className="font-medium text-sky-800 dark:text-sky-200">
                        {formatNumber(previewResult.pacSavings.annualEnergySavingsKwh, 0)} kWh (
                        {formatNumber(previewResult.pacSavings.annualEnergySavingsPercent, 1)} %)
                      </dd>
                    </div>
                    {previewResult.pacSavings.annualCostSavings != null ? (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Économie budget énergie estimée / an</dt>
                        <dd className="font-medium">{formatCurrency(previewResult.pacSavings.annualCostSavings)}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{previewResult.pacSavings.commercialMessage}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Chiffrage PAC indisponible sur ces entrées. Les montants déstrat ne s&apos;appliquent pas — étude de
                  dimensionnement requise.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-600/40 bg-amber-500/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                Hors périmètre simulateur
              </p>
              <p className="mt-2 text-sm text-amber-950 dark:text-amber-100">{previewResult.ceeSolution.commercialMessage}</p>
              <p className="mt-3 text-xs text-muted-foreground">{previewResult.ceeSolution.reason}</p>
            </div>
          )}
        </section>
      </div>
      {footer ? <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">{footer}</div> : null}
    </div>
  );
}
