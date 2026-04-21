"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  buildAutoCampaignLabels,
  buildGenerateCampaignPlan,
  DEFAULT_GOOGLE_MAPS_COUNTRY,
  getDefaultGenerateCampaignConfig,
  LEAD_GENERATION_SECTOR_OPTIONS,
  sectorNeedsCustomQueries,
} from "../lib/generate-campaign";
import { LeadGenerationGoogleMapsRegionSelect } from "./lead-generation-google-maps-region-select";
import {
  appendGenerateCampaignPreset,
  mergeGenerateCampaignConfig,
  type GenerateCampaignStoredConfig,
  readGenerateCampaignPresets,
} from "../lib/generate-campaign-storage";
import { isLeadGenGoogleMapsGeoValue } from "../lib/google-maps-region-options";
import type { LeadGenerationCeeImportScope } from "../queries/get-lead-generation-cee-import-scope";
import { generateAndEnrichLeadsActionInputSchema } from "../schemas/lead-generation-actions.schema";

import { LeadGenerationCeeTeamPickers } from "./lead-generation-cee-team-pickers";

const PRESET_NONE = "__none__";

export type LeadGenerationGenerateCampaignModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig: GenerateCampaignStoredConfig;
  onLaunch: (payload: GenerateCampaignStoredConfig) => Promise<{ ok: boolean; error?: string }>;
  ceeScope: LeadGenerationCeeImportScope;
  /**
   * `mapsOnly` : import carte + fusion du lot uniquement (cockpit simplifié), sans promettre annuaire ni enrichissement automatique.
   */
  variant?: "default" | "mapsOnly";
};

function toPayload(form: GenerateCampaignStoredConfig): GenerateCampaignStoredConfig {
  return {
    ...form,
    campaignName: form.campaignName.trim(),
    zone: form.zone.trim(),
    customQueriesText: form.customQueriesText ?? "",
    maxCrawledPlacesPerSearch: Number(form.maxCrawledPlacesPerSearch),
    maxTotalPlaces: Number(form.maxTotalPlaces),
  };
}

/** Valeur stockée hors liste (ancien preset / localStorage) : évite un Select contrôlé incohérent. */
function coerceStoredConfig(config: GenerateCampaignStoredConfig): GenerateCampaignStoredConfig {
  const merged = mergeGenerateCampaignConfig(config);
  const allowed = new Set<string>(LEAD_GENERATION_SECTOR_OPTIONS);
  const nextSector = allowed.has(merged.sector) ? merged.sector : getDefaultGenerateCampaignConfig().sector;
  const zone = merged.zone?.trim() || DEFAULT_GOOGLE_MAPS_COUNTRY;
  const nextZone = isLeadGenGoogleMapsGeoValue(zone) ? zone : DEFAULT_GOOGLE_MAPS_COUNTRY;
  return { ...merged, sector: nextSector, zone: nextZone };
}

export function LeadGenerationGenerateCampaignModal({
  open,
  onOpenChange,
  initialConfig,
  onLaunch,
  ceeScope,
  variant = "default",
}: LeadGenerationGenerateCampaignModalProps) {
  const [form, setForm] = useState<GenerateCampaignStoredConfig>(initialConfig);
  const [presetName, setPresetName] = useState("");
  const [presetPick, setPresetPick] = useState(PRESET_NONE);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [presets, setPresets] = useState(() => readGenerateCampaignPresets());
  const userEditedCampaignRef = useRef(false);
  const userEditedPresetRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const cfg = coerceStoredConfig(initialConfig);
    setForm(cfg);
    setLocalError(null);
    setPresetPick(PRESET_NONE);
    setPresetName("");
    setPresets(readGenerateCampaignPresets());
    userEditedCampaignRef.current = cfg.campaignName.trim().length > 0;
    userEditedPresetRef.current = false;
  }, [open, initialConfig]);

  const plan = useMemo(
    () =>
      buildGenerateCampaignPlan({
        sector: form.sector,
        zone: form.zone,
        customQueriesText: form.customQueriesText ?? "",
        maxCrawledPlacesPerSearch: Number(form.maxCrawledPlacesPerSearch) || 1,
        maxTotalPlaces: Number(form.maxTotalPlaces) || 1,
      }),
    [form.sector, form.zone, form.customQueriesText, form.maxCrawledPlacesPerSearch, form.maxTotalPlaces],
  );

  const previewExamples = plan.searchStrings.slice(0, 3);
  const usingCustom = (form.customQueriesText ?? "").split(/\r?\n/).some((l) => l.trim().length > 0);

  const autoLabels = useMemo(
    () =>
      buildAutoCampaignLabels({
        zone: form.zone,
        searchStrings: plan.searchStrings,
        sector: form.sector,
      }),
    [form.zone, form.sector, plan.searchStrings],
  );

  useEffect(() => {
    if (!open) return;
    if (!autoLabels.campaignName) return;
    if (!userEditedCampaignRef.current) {
      setForm((f) => ({ ...f, campaignName: autoLabels.campaignName }));
    }
    if (!userEditedPresetRef.current) {
      setPresetName(autoLabels.presetName);
    }
  }, [open, autoLabels.campaignName, autoLabels.presetName]);

  async function handleLaunch() {
    setLocalError(null);
    const payload = toPayload(form);
    const parsed = generateAndEnrichLeadsActionInputSchema.safeParse(payload);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Vérifiez les champs du formulaire.");
      return;
    }
    if (sectorNeedsCustomQueries(parsed.data.sector) && !usingCustom) {
      setLocalError("Pour ce secteur, renseignez au moins une requête personnalisée.");
      return;
    }
    if (plan.searchStrings.length === 0) {
      setLocalError("Aucune recherche à lancer. Complétez le métier et la zone, ou les requêtes personnalisées.");
      return;
    }
    setBusy(true);
    try {
      const out = await onLaunch(parsed.data);
      if (!out.ok) {
        setLocalError(out.error ?? "L’opération a échoué.");
        return;
      }
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  function handleSavePreset() {
    setLocalError(null);
    const name = presetName.trim();
    if (!name) {
      setLocalError("Indiquez un nom pour enregistrer le preset.");
      return;
    }
    const parsed = generateAndEnrichLeadsActionInputSchema.safeParse(toPayload(form));
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Corrigez le formulaire avant d’enregistrer.");
      return;
    }
    if (sectorNeedsCustomQueries(parsed.data.sector) && !usingCustom) {
      setLocalError("Pour ce secteur, ajoutez des requêtes personnalisées avant d’enregistrer le preset.");
      return;
    }
    appendGenerateCampaignPreset(name, parsed.data);
    setPresetName("");
    setPresetPick(PRESET_NONE);
    setPresets(readGenerateCampaignPresets());
  }

  // Radix Dialog en mode non-modal : le Select Base UI (portail) peut recevoir le focus et ouvrir la liste.
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {variant === "mapsOnly" ? "Créer des leads (carte)" : "Configurer la génération de leads"}
          </DialogTitle>
          <DialogDescription>
            {variant === "mapsOnly" ? (
              <>
                Recherche sur la carte et ajout au carnet. Les étapes annuaire, réseaux professionnels et enrichissement
                automatique se trouvent dans « Outils avancés » si vous en avez besoin.
              </>
            ) : (
              <>
                Définissez la cible avant lancement : le volume est estimé à partir de vos paramètres (l’import réel peut
                varier selon les cartes).
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <LeadGenerationCeeTeamPickers
            scope={ceeScope}
            ceeSheetId={form.ceeSheetId}
            targetTeamId={form.targetTeamId}
            onCeeSheetIdChange={(id) => setForm((f) => ({ ...f, ceeSheetId: id }))}
            onTargetTeamIdChange={(id) => setForm((f) => ({ ...f, targetTeamId: id }))}
            disabled={busy}
            idPrefix="lg-modal-cee"
          />

          {presets.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="lg-preset-load">Charger un modèle</Label>
              <Select
                value={presetPick}
                onValueChange={(v) => {
                  const next = v ?? PRESET_NONE;
                  setPresetPick(next);
                  if (next === PRESET_NONE) return;
                  const hit = presets.find((p) => p.name === next);
                  if (hit) {
                    userEditedCampaignRef.current = true;
                    userEditedPresetRef.current = true;
                    setForm(coerceStoredConfig(hit.config));
                  }
                }}
              >
                <SelectTrigger id="lg-preset-load" className="w-full">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PRESET_NONE}>Aucun</SelectItem>
                  {presets.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="lg-campaign-name">Nom de campagne</Label>
            <Input
              id="lg-campaign-name"
              value={form.campaignName}
              onChange={(e) => {
                const v = e.target.value;
                if (!v.trim()) {
                  userEditedCampaignRef.current = false;
                  setForm((f) => ({ ...f, campaignName: autoLabels.campaignName }));
                  return;
                }
                userEditedCampaignRef.current = true;
                setForm((f) => ({ ...f, campaignName: v }));
              }}
              placeholder="Généré à partir des requêtes et de la zone — modifiable"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lg-sector">Secteur / métier</Label>
              <Select
                value={form.sector}
                onValueChange={(v) => {
                  if (!v) return;
                  setForm((f) => ({ ...f, sector: v as GenerateCampaignStoredConfig["sector"] }));
                }}
              >
                <SelectTrigger id="lg-sector" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_GENERATION_SECTOR_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lg-country">Pays</Label>
              <Input id="lg-country" value={DEFAULT_GOOGLE_MAPS_COUNTRY} disabled />
              <p className="text-[11px] text-muted-foreground">France est appliquée par défaut.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lg-zone-select">Département / territoire</Label>
              <p className="text-[11px] text-muted-foreground">
                Facultatif: si vide, la recherche reste sur la France entière.
              </p>
              <LeadGenerationGoogleMapsRegionSelect
                id="lg-zone-select"
                value={form.zone}
                onValueChange={(v) => setForm((f) => ({ ...f, zone: v }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lg-max-per">Max. fiches par recherche</Label>
              <Input
                id="lg-max-per"
                type="number"
                min={1}
                max={200}
                value={form.maxCrawledPlacesPerSearch}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxCrawledPlacesPerSearch: Number(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lg-max-total">Max. total (plafond)</Label>
              <Input
                id="lg-max-total"
                type="number"
                min={1}
                max={50_000}
                value={form.maxTotalPlaces}
                onChange={(e) => setForm((f) => ({ ...f, maxTotalPlaces: Number(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lg-custom-queries">Requêtes personnalisées (optionnel)</Label>
            <Textarea
              id="lg-custom-queries"
              value={form.customQueriesText ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, customQueriesText: e.target.value }))}
              placeholder={"Une ligne = une recherche Maps.\nSi vide, des requêtes sont proposées à partir du métier et de la zone."}
              rows={4}
              className="min-h-[88px] text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Si vous renseignez ce champ, ces requêtes sont utilisées en priorité (jusqu’à 20 lignes).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.includeWebResults}
                onChange={(e) => setForm((f) => ({ ...f, includeWebResults: e.target.checked }))}
              />
              Inclure des résultats web complémentaires
            </label>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">Aperçu</p>
            <ul className="mt-1.5 space-y-1 text-[13px] text-muted-foreground">
              <li>
                <span className="text-foreground/90">Requêtes retenues : </span>
                {plan.searchStrings.length}
                {plan.rawQueries.length > plan.searchStrings.length ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    {" "}
                    (limité par votre plafond total)
                  </span>
                ) : null}
              </li>
              <li>
                <span className="text-foreground/90">Mode : </span>
                {usingCustom ? "requêtes personnalisées" : "généré à partir du métier et de la zone"}
              </li>
              <li>
                <span className="text-foreground/90">Volume estimé (ordre de grandeur) : </span>
                ~{plan.estimatedVolume} fiche{plan.estimatedVolume > 1 ? "s" : ""}
              </li>
            </ul>
            {previewExamples.length > 0 ? (
              <div className="mt-2 text-[12px] text-muted-foreground">
                <span className="font-medium text-foreground/80">Exemples : </span>
                {previewExamples.map((q, i) => (
                  <span key={i}>
                    {i > 0 ? " · " : null}
                    <span className="italic">«{q}»</span>
                  </span>
                ))}
                {plan.searchStrings.length > previewExamples.length ? "…" : null}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-amber-800 dark:text-amber-200">
                Aucun exemple : complétez les champs ou les requêtes personnalisées.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lg-preset-name">Nom du preset (pour enregistrer)</Label>
            <Input
              id="lg-preset-name"
              value={presetName}
              onChange={(e) => {
                const v = e.target.value;
                if (!v.trim()) {
                  userEditedPresetRef.current = false;
                  setPresetName(autoLabels.presetName);
                  return;
                }
                userEditedPresetRef.current = true;
                setPresetName(v);
              }}
              placeholder="Identique au nom de campagne par défaut — modifiable"
              autoComplete="off"
            />
          </div>

          {localError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-sm text-destructive">
              {localError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={handleSavePreset}>
            Enregistrer comme preset
          </Button>
          <Button type="button" disabled={busy} onClick={handleLaunch}>
            {busy
              ? "Lancement…"
              : variant === "mapsOnly"
                ? "Lancer la création"
                : "Lancer la génération"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
