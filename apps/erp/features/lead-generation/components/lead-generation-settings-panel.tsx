"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLeadGenerationSettingsAction } from "../actions/update-lead-generation-settings-action";
import type { LeadGenerationSettings } from "../settings/default-settings";

type Props = {
  initialSettings: LeadGenerationSettings;
  invalidKeys: string[];
};

function asInt(v: string, fallback: number): number {
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

export function LeadGenerationSettingsPanel({ initialSettings, invalidKeys }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const [commercial, setCommercial] = useState(initialSettings.commercialScoring);
  const [dispatch, setDispatch] = useState(initialSettings.dispatchQueueRules);
  const [recycling, setRecycling] = useState(initialSettings.recyclingRules);
  const [automation, setAutomation] = useState(initialSettings.automationLimits);
  const [ui, setUi] = useState(initialSettings.uiBatchLimits);
  const [mainActions, setMainActions] = useState(initialSettings.mainActionsDefaults);

  const invalidLabel = useMemo(
    () => (invalidKeys.length > 0 ? `Fallback appliqué pour: ${invalidKeys.join(", ")}` : null),
    [invalidKeys],
  );

  function save(
    key:
      | "commercial_scoring"
      | "dispatch_queue_rules"
      | "recycling_rules"
      | "automation_limits"
      | "ui_batch_limits"
      | "main_actions_defaults",
    value: Record<string, unknown>,
  ) {
    setStatus(null);
    startTransition(async () => {
      const res = await updateLeadGenerationSettingsAction({ key, value });
      if (!res.ok) {
        setStatus(res.error);
        return;
      }
      setStatus(`Réglage ${key} enregistré.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {invalidLabel ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
          {invalidLabel}
        </p>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Scoring commercial</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Priorité low max" value={commercial.priority_low_max} onChange={(v) => setCommercial((p) => ({ ...p, priority_low_max: asInt(v, p.priority_low_max) }))} />
          <Field label="Priorité normal min" value={commercial.priority_normal_min} onChange={(v) => setCommercial((p) => ({ ...p, priority_normal_min: asInt(v, p.priority_normal_min) }))} />
          <Field label="Priorité high min" value={commercial.priority_high_min} onChange={(v) => setCommercial((p) => ({ ...p, priority_high_min: asInt(v, p.priority_high_min) }))} />
          <Field label="Priorité critical min" value={commercial.priority_critical_min} onChange={(v) => setCommercial((p) => ({ ...p, priority_critical_min: asInt(v, p.priority_critical_min) }))} />
        </div>
        <Button type="button" size="sm" onClick={() => save("commercial_scoring", commercial)} disabled={pending}>
          Enregistrer
        </Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">File de dispatch</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Score ready min" value={dispatch.score_ready_min} onChange={(v) => setDispatch((p) => ({ ...p, score_ready_min: asInt(v, p.score_ready_min) }))} />
          <Field label="Score ready strong" value={dispatch.score_ready_strong} onChange={(v) => setDispatch((p) => ({ ...p, score_ready_strong: asInt(v, p.score_ready_strong) }))} />
          <Field label="Score low band" value={dispatch.score_low_band} onChange={(v) => setDispatch((p) => ({ ...p, score_low_band: asInt(v, p.score_low_band) }))} />
          <Field label="Score enrich floor" value={dispatch.score_enrich_floor} onChange={(v) => setDispatch((p) => ({ ...p, score_enrich_floor: asInt(v, p.score_enrich_floor) }))} />
        </div>
        <Button type="button" size="sm" onClick={() => save("dispatch_queue_rules", dispatch)} disabled={pending}>
          Enregistrer
        </Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Recyclage</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Jours sans ouverture" value={recycling.days_assigned_without_open} onChange={(v) => setRecycling((p) => ({ ...p, days_assigned_without_open: asInt(v, p.days_assigned_without_open) }))} />
          <Field label="Jours de silence" value={recycling.days_silence_after_last_touch} onChange={(v) => setRecycling((p) => ({ ...p, days_silence_after_last_touch: asInt(v, p.days_silence_after_last_touch) }))} />
          <Field label="Min tentatives recyclage" value={recycling.min_attempts_for_recycle} onChange={(v) => setRecycling((p) => ({ ...p, min_attempts_for_recycle: asInt(v, p.min_attempts_for_recycle) }))} />
        </div>
        <Button type="button" size="sm" onClick={() => save("recycling_rules", recycling)} disabled={pending}>
          Enregistrer
        </Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Limites automatisations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Sync imports limit" value={automation.sync_pending_imports_limit} onChange={(v) => setAutomation((p) => ({ ...p, sync_pending_imports_limit: asInt(v, p.sync_pending_imports_limit) }))} />
          <Field label="Score recent stock limit" value={automation.score_recent_stock_limit} onChange={(v) => setAutomation((p) => ({ ...p, score_recent_stock_limit: asInt(v, p.score_recent_stock_limit) }))} />
          <Field label="Evaluate dispatch queue limit" value={automation.evaluate_dispatch_queue_limit} onChange={(v) => setAutomation((p) => ({ ...p, evaluate_dispatch_queue_limit: asInt(v, p.evaluate_dispatch_queue_limit) }))} />
          <Field label="Evaluate recycling limit" value={automation.evaluate_recycling_limit} onChange={(v) => setAutomation((p) => ({ ...p, evaluate_recycling_limit: asInt(v, p.evaluate_recycling_limit) }))} />
        </div>
        <Button type="button" size="sm" onClick={() => save("automation_limits", automation)} disabled={pending}>
          Enregistrer
        </Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Actions principales (générer / préparer / dispatch)</h2>
        <p className="text-xs text-muted-foreground">
          Le bouton « Générer des leads » du cockpit ouvre désormais une configuration (métier, zone, plafonds) : les
          recherches ci-dessous ne sont plus utilisées pour ce lancement. Elles restent disponibles pour d’autres usages
          ou imports manuels. Les limites ci-dessous concernent surtout l’enrichissement post-import et les valeurs par
          défaut historiques.
        </p>
        <div className="space-y-2">
          <Label>Recherches Apify historiques (une par ligne, max 20)</Label>
          <Textarea
            value={mainActions.apify.search_strings.join("\n")}
            onChange={(e) => {
              const lines = e.target.value
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter((l) => l.length > 0)
                .slice(0, 20);
              setMainActions((p) => ({
                ...p,
                apify: { ...p.apify, search_strings: lines },
              }));
            }}
            rows={5}
            className="font-mono text-sm"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Max lieux / recherche (Apify)"
            value={mainActions.apify.max_crawled_places_per_search}
            onChange={(v) =>
              setMainActions((p) => ({
                ...p,
                apify: { ...p.apify, max_crawled_places_per_search: asInt(v, p.apify.max_crawled_places_per_search) },
              }))
            }
          />
          <div className="space-y-1.5">
            <Label>Inclure résultats web</Label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mainActions.apify.include_web_results}
                onChange={(e) =>
                  setMainActions((p) => ({
                    ...p,
                    apify: { ...p.apify, include_web_results: e.target.checked },
                  }))
                }
              />
              Oui
            </label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Zone Maps (vide = France métropolitaine par défaut)</Label>
            <Input
              value={mainActions.apify.location_query ?? ""}
              onChange={(e) =>
                setMainActions((p) => ({
                  ...p,
                  apify: { ...p.apify, location_query: e.target.value.trim() === "" ? null : e.target.value },
                }))
              }
              maxLength={200}
            />
          </div>
          <Field
            label="Enrichissement après import (max 50)"
            value={mainActions.post_import_enrich_limit}
            onChange={(v) =>
              setMainActions((p) => ({ ...p, post_import_enrich_limit: asInt(v, p.post_import_enrich_limit) }))
            }
          />
          <Field
            label="Lot « préparer » (score + file)"
            value={mainActions.prepare_batch_limit}
            onChange={(v) => setMainActions((p) => ({ ...p, prepare_batch_limit: asInt(v, p.prepare_batch_limit) }))}
          />
          <Field
            label="Plafond actif / agent (auto-dispatch)"
            value={mainActions.agent_stock_cap}
            onChange={(v) => setMainActions((p) => ({ ...p, agent_stock_cap: asInt(v, p.agent_stock_cap) }))}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            save("main_actions_defaults", {
              apify: mainActions.apify,
              post_import_enrich_limit: mainActions.post_import_enrich_limit,
              prepare_batch_limit: mainActions.prepare_batch_limit,
              agent_stock_cap: mainActions.agent_stock_cap,
            })
          }
          disabled={pending}
        >
          Enregistrer
        </Button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Limites quick UI</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Quick score limit" value={ui.quick_score_limit} onChange={(v) => setUi((p) => ({ ...p, quick_score_limit: asInt(v, p.quick_score_limit) }))} />
          <Field label="Quick enrichment limit" value={ui.quick_enrichment_limit} onChange={(v) => setUi((p) => ({ ...p, quick_enrichment_limit: asInt(v, p.quick_enrichment_limit) }))} />
          <Field label="Quick dispatch queue limit" value={ui.quick_dispatch_queue_limit} onChange={(v) => setUi((p) => ({ ...p, quick_dispatch_queue_limit: asInt(v, p.quick_dispatch_queue_limit) }))} />
          <Field label="Quick recycling limit" value={ui.quick_recycling_limit} onChange={(v) => setUi((p) => ({ ...p, quick_recycling_limit: asInt(v, p.quick_recycling_limit) }))} />
        </div>
        <Button type="button" size="sm" onClick={() => save("ui_batch_limits", ui)} disabled={pending}>
          Enregistrer
        </Button>
      </section>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" value={String(value)} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
