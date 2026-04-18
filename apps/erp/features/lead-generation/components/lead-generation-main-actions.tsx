"use client";

import { CheckCircle2, CircleOff, Gauge, Loader2, OctagonAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { buildLeadGenerationStockQuickFiltreUrl } from "../lib/build-lead-generation-list-url";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { autoDispatchLeadsAction } from "../actions/auto-dispatch-leads-action";
import { generateAndEnrichLeadsAction } from "../actions/generate-and-enrich-leads-action";
import { prepareLeadsAction } from "../actions/prepare-leads-action";
import type {
  AutoDispatchLeadsResult,
  GenerateAndEnrichLeadsResult,
  PrepareLeadsResult,
} from "../domain/main-actions-result";
import type { UnifiedLeadGenerationPipelineResult } from "../services/run-unified-lead-generation-pipeline";
import {
  buildGenerateCampaignPlan,
  parseCustomQueries,
  sectorNeedsCustomQueries,
} from "../lib/generate-campaign";
import { humanizeLeadGenerationActionError as humanizeActionError } from "../lib/humanize-lead-generation-action-error";
import {
  mergeGenerateCampaignConfig,
  readLastGenerateCampaignConfig,
  writeLastGenerateCampaignConfig,
  type GenerateCampaignStoredConfig,
} from "../lib/generate-campaign-storage";
import {
  generateAndEnrichLeadsActionInputSchema,
  unifiedLeadGenerationPipelineBodySchema,
} from "../schemas/lead-generation-actions.schema";
import type { LeadGenerationImportBatchListItem } from "../queries/get-lead-generation-import-batches";
import type {
  LeadGenerationPipelineCockpitSnapshot,
  LeadGenerationPipelineRecommendedStep,
} from "../queries/get-lead-generation-pipeline-cockpit-snapshot";
import { LeadGenerationGenerateCampaignModal } from "./lead-generation-generate-campaign-modal";
import { LeadGenerationSyncingImportsBanner } from "./lead-generation-syncing-imports-banner";

/** @deprecated Utiliser `LeadGenerationPipelineCockpitSnapshot` côté page. */
export type LeadGenerationCockpitMetrics = {
  leadsReadyNow: number;
  leadsEnrichFirst: number;
  stockReadyCount: number;
  importsRunning: number;
};

type ActionId = "generate" | "prepare" | "dispatch";
type RunKind = ActionId | "pipeline";

type PanelPhase = "idle" | "loading" | "success" | "empty" | "error";

type ResultRow = { label: string; value: string };

type Banner = { tone: "info" | "warning"; text: string };

type PanelSnapshot = {
  phase: PanelPhase;
  rows?: ResultRow[];
  emptyHint?: string;
  errorMessage?: string;
  banners?: Banner[];
  /** Phrase d’estimation business (résultat). */
  businessNote?: string;
};

type VolumeSnapshot = {
  imported?: number;
  accepted?: number;
  enriched?: number;
  improved?: number;
  scored?: number;
  readyNow?: number;
  enrichNeeded?: number;
  assigned?: number;
  remaining?: number;
};

type RunEntryV2 = {
  at: number;
  actionType: RunKind;
  summary: string;
  volume: VolumeSnapshot;
};

type StoreV2 = { v: 2; runs: Partial<Record<RunKind, RunEntryV2>> };

const LEGACY_STORAGE_KEY = "lg-main-actions:last-run:v1";
const STORAGE_KEY = "lg-main-actions:cockpit:v2";

const COOLDOWN_MS = 8_000;
const IMPORT_BACKLOG_SOFT_CAP = 12;

const UNIFIED_PIPELINE_LOADING_STEPS = [
  "1/5 — Carte (Maps) et fusion du lot…",
  "2/5 — Pages Jaunes (annuaire)…",
  "3/5 — LinkedIn ciblé sur le lot…",
  "4/5 — Amélioration des fiches (email, site, analyse)…",
  "5/5 — Distribution aux commerciaux…",
] as const;

const UNIFIED_PIPELINE_LOADING_STEPS_LIST: string[] = [...UNIFIED_PIPELINE_LOADING_STEPS];

function formatDispatchTeaserLines(leads: number, agents: number): string[] {
  if (leads === 0) {
    return [
      "Aucun contact prêt à confier pour l’instant.",
      `${agents} commercial${agents > 1 ? "aux" : ""} éligible${agents > 1 ? "s" : ""}`,
      "Complétez les fiches (email, site), puis utilisez « Améliorer les leads » avant de distribuer.",
    ];
  }
  const lines = [
    `${leads} contact${leads > 1 ? "s" : ""} prêt${leads > 1 ? "s" : ""} à confier aux équipes`,
    `${agents} commercial${agents > 1 ? "aux" : ""} éligible${agents > 1 ? "s" : ""}`,
  ];
  if (leads > 0 && agents > 0) {
    const minEach = Math.floor(leads / agents);
    const rem = leads % agents;
    lines.push(
      rem === 0
        ? `En moyenne ~${minEach} contact${minEach > 1 ? "s" : ""} par commercial (répartition automatique).`
        : `Environ ${minEach} à ${minEach + 1} contacts par commercial (répartition automatique).`,
    );
  } else if (leads > 0 && agents === 0) {
    lines.push("Ajoutez des commerciaux éligibles pour répartir équitablement.");
  }
  return lines;
}

function cockpitHeadlineFromStep(step: LeadGenerationPipelineRecommendedStep): string {
  switch (step) {
    case "wait_imports":
      return "Imports en cours";
    case "generate":
      return "Aucun lead disponible";
    case "improve":
      return "Leads à améliorer";
    case "assign":
      return "Leads prêts à distribuer";
    case "balanced":
    default:
      return "État du pipeline";
  }
}

function readStoreV2(): StoreV2 {
  if (typeof window === "undefined") return { v: 2, runs: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreV2;
      if (parsed?.v === 2 && parsed.runs) return parsed;
    }
    const leg = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (leg) {
      const old = JSON.parse(leg) as Partial<Record<ActionId, { at: number; summary: string }>>;
      const runs: StoreV2["runs"] = {};
      for (const k of ["generate", "prepare", "dispatch"] as ActionId[]) {
        const e = old[k];
        if (e) {
          runs[k] = { at: e.at, actionType: k, summary: e.summary, volume: {} };
        }
      }
      const next: StoreV2 = { v: 2, runs };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }
  } catch {
    /* ignore */
  }
  return { v: 2, runs: {} };
}

function writeRunEntry(kind: RunKind, summary: string, volume: VolumeSnapshot) {
  if (typeof window === "undefined") return;
  try {
    const prev = readStoreV2();
    const next: StoreV2 = {
      v: 2,
      runs: {
        ...prev.runs,
        [kind]: { at: Date.now(), actionType: kind, summary, volume },
      },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

function formatLastRunTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatVolumeShort(vol: VolumeSnapshot): string {
  const parts: string[] = [];
  if (vol.accepted != null && vol.accepted > 0) parts.push(`${vol.accepted} retenu(s)`);
  if (vol.enriched != null && vol.enriched > 0) parts.push(`${vol.enriched} complété(s)`);
  if (vol.improved != null && vol.improved > 0) parts.push(`${vol.improved} coord. complétées`);
  if (vol.scored != null && vol.scored > 0) parts.push(`${vol.scored} analysée(s)`);
  if (vol.assigned != null && vol.assigned > 0) parts.push(`${vol.assigned} attribué(s)`);
  return parts.length > 0 ? ` · ${parts.join(", ")}` : "";
}

const LOADING_STEPS: Record<ActionId, string[]> = {
  generate: [
    "Récupération des nouveaux contacts…",
    "Synchronisation des fichiers fournisseurs…",
    "Contrôle et intégration dans le carnet…",
    "Compléments automatiques sur un échantillon…",
  ],
  prepare: [
    "Complément des coordonnées utiles…",
    "Analyse des priorités…",
    "Mise à jour des contacts prêts à confier…",
  ],
  dispatch: [
    "Lecture des équipes et des contacts prêts…",
    "Répartition selon les plafonds…",
    "Finalisation des attributions…",
  ],
};

function LoadingTickerMessage({
  actionId,
  overrideSteps,
}: {
  actionId: ActionId;
  overrideSteps?: string[];
}) {
  const steps = overrideSteps ?? LOADING_STEPS[actionId];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [actionId, steps.length]);

  return <span>{steps[step] ?? steps[0]}</span>;
}

function summarizeGenerate(d: GenerateAndEnrichLeadsResult): string {
  return `${d.total_imported} contact(s) importé(s) · ${d.total_accepted} retenu(s) · ${d.total_enriched} complété(s)`;
}

function summarizePrepare(d: PrepareLeadsResult): string {
  const imp =
    d.improvement_attempted > 0
      ? `${d.improvement_succeeded}/${d.improvement_attempted} fiches complétées · `
      : "";
  return `${imp}${d.total_scored} analysée(s) · ${d.total_ready_now} prête(s) à confier · ${d.total_enrich_needed} encore à travailler`;
}

function summarizeDispatch(d: AutoDispatchLeadsResult): string {
  return `${d.total_assigned} attribué(s) · ${d.remaining_leads} reste(nt) à confier`;
}

function summarizeUnifiedPipelineRun(u: UnifiedLeadGenerationPipelineResult): string {
  return `Carte ${u.counts.generatedAccepted} · PJ ${u.counts.yellowPatched} · LinkedIn ${u.counts.linkedInUpdated} · amélioration ${u.counts.improved} · distribuées ${u.counts.distributed}`;
}

type LeadGenerationMainActionsProps = {
  pipelineSnapshot: LeadGenerationPipelineCockpitSnapshot;
  /** Commerciaux pouvant recevoir des attributions (vue cockpit). */
  assignableAgentsCount: number;
  syncingImportBatches: LeadGenerationImportBatchListItem[];
};

export function LeadGenerationMainActions({
  pipelineSnapshot,
  assignableAgentsCount,
  syncingImportBatches,
}: LeadGenerationMainActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [active, setActive] = useState<ActionId | null>(null);
  const [pipelineMode, setPipelineMode] = useState(false);
  const [loadSession, setLoadSession] = useState(0);

  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownTick, setCooldownTick] = useState(0);

  const [store, setStore] = useState<StoreV2>({ v: 2, runs: {} });

  const [panels, setPanels] = useState<Record<ActionId, PanelSnapshot>>({
    generate: { phase: "idle" },
    prepare: { phase: "idle" },
    dispatch: { phase: "idle" },
  });

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateIntent, setGenerateIntent] = useState<"standalone" | "pipeline">("standalone");
  const [generateModalInitial, setGenerateModalInitial] = useState<GenerateCampaignStoredConfig>(() =>
    mergeGenerateCampaignConfig(null),
  );
  const [pipelinePreflightOpen, setPipelinePreflightOpen] = useState(false);
  const [pipelinePreflightConfig, setPipelinePreflightConfig] = useState<GenerateCampaignStoredConfig | null>(null);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [generateConfirmConfig, setGenerateConfirmConfig] = useState<GenerateCampaignStoredConfig | null>(null);
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false);
  const [lastCampaignLabel, setLastCampaignLabel] = useState<string | null>(null);

  const generateConfirmPlan = useMemo(() => {
    if (!generateConfirmConfig) return null;
    return buildGenerateCampaignPlan({
      sector: generateConfirmConfig.sector,
      zone: generateConfirmConfig.zone,
      customQueriesText: generateConfirmConfig.customQueriesText ?? "",
      maxCrawledPlacesPerSearch: generateConfirmConfig.maxCrawledPlacesPerSearch,
      maxTotalPlaces: generateConfirmConfig.maxTotalPlaces,
    });
  }, [generateConfirmConfig]);

  const refreshLastCampaignLabel = useCallback(() => {
    const c = readLastGenerateCampaignConfig();
    const name = c?.campaignName?.trim();
    setLastCampaignLabel(name && name.length > 0 ? name : null);
  }, []);

  useEffect(() => {
    refreshLastCampaignLabel();
  }, [refreshLastCampaignLabel, generateModalOpen, pipelinePreflightOpen]);

  const openGenerateModal = useCallback((intent: "standalone" | "pipeline") => {
    setGenerateIntent(intent);
    setGenerateModalInitial(mergeGenerateCampaignConfig(readLastGenerateCampaignConfig()));
    setGenerateModalOpen(true);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setStore(readStoreV2()));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setCooldownTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, [cooldownUntil, cooldownTick]);

  const cooldownActive = Date.now() < cooldownUntil;
  const cooldownSecondsLeft = cooldownActive ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;

  /** Parcours Apify unifié ou pause post-action — ne pas confondre avec `pending` (transition React sur une autre colonne). */
  const anyBusy = pending || pipelineBusy;
  const pipelineOrCooldownLocked = pipelineBusy || cooldownActive;

  const startCooldown = useCallback(() => {
    setCooldownUntil(Date.now() + COOLDOWN_MS);
  }, []);

  const refreshStore = useCallback(() => {
    setStore(readStoreV2());
  }, []);

  const bumpRun = useCallback(
    (kind: RunKind, summary: string, volume: VolumeSnapshot) => {
      writeRunEntry(kind, summary, volume);
      refreshStore();
    },
    [refreshStore],
  );

  const setPanel = useCallback((id: ActionId, snap: PanelSnapshot) => {
    setPanels((p) => ({ ...p, [id]: snap }));
  }, []);

  const canGenerate = pipelineSnapshot.importsRunning < IMPORT_BACKLOG_SOFT_CAP;
  const canPrepare = pipelineSnapshot.stockReadyCount > 0;
  const canDispatch = pipelineSnapshot.leadsReadyToAssign > 0;
  const canPipeline = canGenerate || canPrepare || canDispatch;

  const improveTeaserLines = useMemo(() => {
    const n = pipelineSnapshot.leadsNeedingContactImprovement;
    const lines: string[] = [];
    if (n > 0) {
      lines.push(
        `${n} fiche${n > 1 ? "s" : ""} peu${n > 1 ? "vent" : "t"} encore être complétée${n > 1 ? "s" : ""} (email, site…).`,
      );
    } else {
      lines.push(
        "Peu de compléments automatiques évidents sur ce stock — l’étape affine tout de même les priorités et les contacts prêts à confier.",
      );
    }
    lines.push(
      `${pipelineSnapshot.stockReadyCount} contact${pipelineSnapshot.stockReadyCount > 1 ? "s" : ""} actif${pipelineSnapshot.stockReadyCount > 1 ? "s" : ""} dans le carnet.`,
    );
    const q = pipelineSnapshot.leadsStillBeingQualified;
    if (q > 0) {
      lines.push(
        `${q} fiche${q > 1 ? "s" : ""} encore en cours de mise au point avant appel.`,
      );
    }
    return lines;
  }, [
    pipelineSnapshot.leadsNeedingContactImprovement,
    pipelineSnapshot.stockReadyCount,
    pipelineSnapshot.leadsStillBeingQualified,
  ]);

  function openGenerateFlow() {
    if (pipelineOrCooldownLocked || pending) return;
    const last = readLastGenerateCampaignConfig();
    const parsed = generateAndEnrichLeadsActionInputSchema.safeParse(last ?? {});
    if (!parsed.success || !last?.campaignName?.trim()) {
      openGenerateModal("standalone");
      return;
    }
    const data = parsed.data;
    if (sectorNeedsCustomQueries(data.sector) && parseCustomQueries(data.customQueriesText ?? "").length === 0) {
      openGenerateModal("standalone");
      return;
    }
    const plan = buildGenerateCampaignPlan({
      sector: data.sector,
      zone: data.zone,
      customQueriesText: data.customQueriesText ?? "",
      maxCrawledPlacesPerSearch: data.maxCrawledPlacesPerSearch,
      maxTotalPlaces: data.maxTotalPlaces,
    });
    if (plan.searchStrings.length === 0) {
      openGenerateModal("standalone");
      return;
    }
    setGenerateConfirmConfig(parsed.data);
    setGenerateConfirmOpen(true);
  }

  function applyGenerateResult(d: GenerateAndEnrichLeadsResult, bump: boolean) {
    const rows: ResultRow[] = [
      { label: "Contacts importés (brut)", value: String(d.total_imported) },
      { label: "Contacts retenus dans le carnet", value: String(d.total_accepted) },
      { label: "Compléments automatiques (échantillon)", value: String(d.total_enriched) },
      { label: "Lots fournisseur synchronisés", value: String(d.sync_batches_scanned) },
    ];
    if (typeof d.yellow_pages_patched === "number" && d.yellow_pages_patched > 0) {
      rows.push({ label: "Fiches patchées (Pages Jaunes)", value: String(d.yellow_pages_patched) });
    }
    if (typeof d.linkedin_stocks_updated === "number" && d.linkedin_stocks_updated > 0) {
      rows.push({ label: "Fiches mises à jour (LinkedIn)", value: String(d.linkedin_stocks_updated) });
    }

    const estPipeline = d.total_accepted + d.total_enriched;
    const businessNote =
      estPipeline > 0
        ? `Estimation circuit court : ~${estPipeline} contact(s) consolidé(s) sur ce run (acceptés + enrichis).`
        : d.apify_run_started
          ? "Estimation : le volume réel sera connu après synchronisation du scraper."
          : undefined;

    const banners: Banner[] = [];
    if (d.apify_run_started && d.total_imported === 0 && d.total_accepted === 0) {
      banners.push({
        tone: "info",
        text: "Import en cours côté fournisseur : le scraping n’est pas terminé. Synchronisez les imports un peu plus tard pour récupérer les fiches.",
      });
    }
    if (d.apify_notice) {
      banners.push({ tone: "warning", text: humanizeActionError(d.apify_notice) });
    }
    if (d.ingest_warnings?.length) {
      for (const w of d.ingest_warnings) {
        banners.push({ tone: "warning", text: w });
      }
    }

    const nothingDone =
      d.total_imported === 0 &&
      d.total_accepted === 0 &&
      d.total_enriched === 0 &&
      d.sync_batches_scanned === 0 &&
      !d.apify_run_started &&
      !d.apify_notice;

    const vol: VolumeSnapshot = {
      imported: d.total_imported,
      accepted: d.total_accepted,
      enriched: d.total_enriched,
    };

    if (nothingDone) {
      setPanel("generate", {
        phase: "empty",
        emptyHint:
          "Aucune fiche n’a été traitée sur cette exécution. Vérifiez la configuration ou relancez lorsque des imports sont prêts.",
      });
      if (bump) bumpRun("generate", "Aucun résultat", vol);
    } else {
      setPanel("generate", {
        phase: "success",
        rows,
        banners: banners.length ? banners : undefined,
        businessNote,
      });
      if (bump) bumpRun("generate", summarizeGenerate(d), vol);
    }
  }

  function applyPrepareResult(d: PrepareLeadsResult, bump: boolean) {
    const rows: ResultRow[] = [
      ...(d.improvement_attempted > 0
        ? [
            {
              label: "Coordonnées complétées (email / site)",
              value: `${d.improvement_succeeded} / ${d.improvement_attempted}`,
            },
          ]
        : []),
      { label: "Fiches analysées (priorités)", value: String(d.total_scored) },
      { label: "Prêtes à confier aux commerciaux", value: String(d.total_ready_now) },
      { label: "Encore à compléter avant appel", value: String(d.total_enrich_needed) },
      { label: "Fiches classées dans le carnet", value: String(d.dispatch_evaluated) },
    ];

    const banners: Banner[] = [];
    if (d.total_scored > 0 && d.total_ready_now === 0) {
      banners.push({
        tone: "warning",
        text: "Les fiches ont été analysées mais aucune n’est encore assez complète pour être distribuée. Poursuivez l’amélioration (email, site, décideur) puis relancez cette étape.",
      });
    }

    const businessNote =
      d.total_ready_now > 0
        ? `Vous pouvez passer à l’étape « Distribuer automatiquement » : environ ${d.total_ready_now} contact(s) prêt(s) à être confié(s).`
        : d.total_enrich_needed > 0
          ? `${d.total_enrich_needed} fiche(s) nécessitent encore des compléments avant un passage commercial efficace.`
          : undefined;

    const vol: VolumeSnapshot = {
      improved: d.improvement_succeeded,
      scored: d.total_scored,
      readyNow: d.total_ready_now,
      enrichNeeded: d.total_enrich_needed,
    };

    if (d.dispatch_evaluated === 0 && d.total_scored === 0 && d.improvement_attempted === 0) {
      setPanel("prepare", {
        phase: "empty",
        emptyHint:
          "Aucune fiche disponible pour cette action. Importez ou générez des contacts, ou vérifiez qu’il reste des fiches actives dans le carnet.",
      });
      if (bump) bumpRun("prepare", "Aucune fiche à traiter", vol);
    } else {
      setPanel("prepare", { phase: "success", rows, businessNote, banners: banners.length ? banners : undefined });
      if (bump) bumpRun("prepare", summarizePrepare(d), vol);
    }
  }

  function applyDispatchResult(d: AutoDispatchLeadsResult, bump: boolean) {
    const rows: ResultRow[] = [
      { label: "Contacts attribués", value: String(d.total_assigned) },
      { label: "Commerciaux pris en compte", value: String(d.agents_considered) },
      { label: "Reste prêt à confier", value: String(d.remaining_leads) },
    ];

    const distEntries = Object.entries(d.distribution_par_agent);
    distEntries.forEach(([name, n]) => rows.push({ label: name, value: String(n) }));

    const banners: Banner[] = [];
    if (d.total_assigned > 0 && d.remaining_leads > 0) {
      banners.push({
        tone: "warning",
        text: "Répartition partielle : il reste des contacts prêts à confier. Relancez la distribution ou libérez de la capacité côté commerciaux.",
      });
    }

    const totalPool = d.total_assigned + d.remaining_leads;
    const coverage =
      totalPool > 0 ? Math.round((d.total_assigned / totalPool) * 100) : null;
    const businessNote =
      d.total_assigned > 0 && coverage != null
        ? `Sur cette exécution, environ ${coverage}% des contacts prêts ont été attribués.`
        : d.total_assigned > 0
          ? `${d.total_assigned} contact(s) confié(s) aux commerciaux.`
          : undefined;

    const vol: VolumeSnapshot = {
      assigned: d.total_assigned,
      remaining: d.remaining_leads,
    };

    if (d.total_assigned === 0 && d.remaining_leads === 0) {
      setPanel("dispatch", {
        phase: "empty",
        emptyHint:
          "Aucun contact prêt à distribuer, ou tous les commerciaux sont déjà à leur limite. Complétez les fiches puis utilisez « Améliorer les leads ».",
      });
      if (bump) bumpRun("dispatch", "Aucune attribution", vol);
    } else if (d.total_assigned === 0 && d.remaining_leads > 0) {
      setPanel("dispatch", {
        phase: "empty",
        emptyHint:
          "Aucune attribution alors qu’il reste des fiches en file : vérifiez plafonds agents et agents actifs.",
        banners: banners.length ? banners : undefined,
      });
      if (bump) bumpRun("dispatch", `${d.remaining_leads} en file — aucune attribution`, vol);
    } else {
      setPanel("dispatch", {
        phase: "success",
        rows,
        banners: banners.length ? banners : undefined,
        businessNote,
      });
      if (bump) bumpRun("dispatch", summarizeDispatch(d), vol);
    }
  }

  function applyUnifiedPipelineResultToPanels(u: UnifiedLeadGenerationPipelineResult) {
    const mapsStep = u.steps.maps?.status ?? "—";
    const ypStep = u.steps.yellow_pages?.status ?? "—";
    const liStep = u.steps.linkedin?.status ?? "—";

    const genRows: ResultRow[] = [
      {
        label: "Carte (Maps) — état",
        value: `${mapsStep} · ${u.counts.generatedAccepted} fiche(s) dans le lot`,
      },
      {
        label: "Pages Jaunes — état",
        value: `${ypStep} · ${u.counts.yellowPatched} fiche(s) enrichies`,
      },
      {
        label: "LinkedIn — état",
        value: `${liStep} · ${u.counts.linkedInUpdated} fiche(s) enrichies`,
      },
    ];

    const genBanners: Banner[] = [];
    if (u.warnings.length > 0) {
      for (const w of u.warnings) {
        genBanners.push({ tone: "warning", text: w });
      }
    }

    const genPhase: PanelPhase =
      u.counts.generatedAccepted === 0 && u.pipelineStatus === "stopped" ? "empty" : "success";

    setPanel("generate", {
      phase: genPhase,
      rows: genRows,
      emptyHint:
        genPhase === "empty"
          ? (u.stopReason ??
            "Aucune fiche n’a été ajoutée au lot sur la carte — vérifiez la campagne ou relancez.")
          : undefined,
      banners: genBanners.length ? genBanners : undefined,
      businessNote:
        u.stopReason && genPhase === "success"
          ? u.stopReason
          : u.pipelineStatus === "completed"
            ? "Parcours unifié terminé : les cinq étapes se sont enchaînées dans l’ordre imposé."
            : undefined,
    });

    const prepBanners: Banner[] = [];
    if (u.counts.readyInLot === 0 && u.counts.improved > 0) {
      prepBanners.push({
        tone: "warning",
        text: "Après amélioration, aucune fiche du lot n’était encore prête à être confiée. Complétez les contacts ou affinez la campagne.",
      });
    }

    setPanel("prepare", {
      phase: "success",
      rows: [
        {
          label: "Compléments / analyse (étape « Améliorer »)",
          value: String(u.counts.improved),
        },
        {
          label: "Prêtes à confier après cette passe",
          value: String(u.counts.readyInLot),
        },
        {
          label: "Restantes à compléter sur le lot",
          value: String(u.counts.remainingToComplete),
        },
      ],
      banners: prepBanners.length ? prepBanners : undefined,
      businessNote:
        u.counts.readyInLot > 0
          ? `${u.counts.readyInLot} contact(s) étaient prêts à confier avant la distribution.`
          : undefined,
    });

    const remainingReady = Math.max(0, u.counts.readyInLot - u.counts.distributed);
    applyDispatchResult(
      {
        total_assigned: u.counts.distributed,
        distribution_par_agent: {},
        remaining_leads: remainingReady,
        agents_considered: assignableAgentsCount,
      },
      false,
    );
  }

  async function runFullPipelineWithPayload(payload: GenerateCampaignStoredConfig) {
    if (pipelineOrCooldownLocked || pending || !canPipeline) return;
    setLoadSession((s) => s + 1);
    setPipelineBusy(true);
    setPipelineMode(true);
    setActive(null);
    setPanel("generate", { phase: "loading" });
    setPanel("prepare", { phase: "loading" });
    setPanel("dispatch", { phase: "loading" });

    void (async () => {
      try {
        const parsed = unifiedLeadGenerationPipelineBodySchema.safeParse(payload);
        if (!parsed.success) {
          const first = parsed.error.issues[0];
          setPanel("generate", {
            phase: "error",
            errorMessage: first?.message ?? "Paramètres de campagne invalides.",
          });
          setPanel("prepare", { phase: "idle" });
          setPanel("dispatch", { phase: "idle" });
          startCooldown();
          await router.refresh();
          return;
        }

        const res = await fetch("/api/lead-generation/unified-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(parsed.data),
        });

        const json = (await res.json()) as UnifiedLeadGenerationPipelineResult | { ok?: false; error?: string };

        if (!res.ok || !("ok" in json) || json.ok !== true) {
          const err = "error" in json && typeof json.error === "string" ? json.error : "Parcours interrompu.";
          setPanel("generate", { phase: "error", errorMessage: humanizeActionError(err) });
          setPanel("prepare", { phase: "idle" });
          setPanel("dispatch", { phase: "idle" });
          startCooldown();
          await router.refresh();
          return;
        }

        writeLastGenerateCampaignConfig(payload);
        refreshLastCampaignLabel();

        const u = json;
        applyUnifiedPipelineResultToPanels(u);

        bumpRun("pipeline", summarizeUnifiedPipelineRun(u), {
          imported: u.counts.generatedAccepted,
          accepted: u.counts.generatedAccepted,
          enriched: u.counts.yellowPatched + u.counts.linkedInUpdated,
          improved: u.counts.improved,
          readyNow: u.counts.readyInLot,
          enrichNeeded: u.counts.remainingToComplete,
          assigned: u.counts.distributed,
          remaining: Math.max(0, u.counts.readyInLot - u.counts.distributed),
        });
        startCooldown();
        await router.refresh();
      } finally {
        setPipelineMode(false);
        setPipelineBusy(false);
      }
    })();
  }

  async function runStandaloneGenerateFromPayload(
    payload: GenerateCampaignStoredConfig,
  ): Promise<{ ok: boolean; error?: string }> {
    if (pipelineOrCooldownLocked || pending) {
      return { ok: false, error: "Une action est déjà en cours. Patientez quelques secondes." };
    }
    setLoadSession((s) => s + 1);
    setActive("generate");
    setPipelineMode(false);
    setPanel("generate", { phase: "loading" });
    const res = await generateAndEnrichLeadsAction(payload);
    setActive(null);
    if (!res.ok) {
      setPanel("generate", { phase: "error", errorMessage: humanizeActionError(res.error) });
      startCooldown();
      router.refresh();
      return { ok: false, error: humanizeActionError(res.error) };
    }
    writeLastGenerateCampaignConfig(payload);
    refreshLastCampaignLabel();
    applyGenerateResult(res.data, true);
    startCooldown();
    router.refresh();
    return { ok: true };
  }

  async function handleGenerateModalLaunch(payload: GenerateCampaignStoredConfig) {
    if (generateIntent === "pipeline") {
      setGenerateModalOpen(false);
      void runFullPipelineWithPayload(payload);
      return { ok: true as const };
    }
    const out = await runStandaloneGenerateFromPayload(payload);
    return out.ok ? { ok: true as const } : { ok: false as const, error: out.error ?? "" };
  }

  function handlePipelineButtonClick() {
    if (pipelineOrCooldownLocked || pending || !canPipeline) return;
    const last = readLastGenerateCampaignConfig();
    if (!last) {
      openGenerateModal("pipeline");
      return;
    }
    setPipelinePreflightConfig(last);
    setPipelinePreflightOpen(true);
  }

  function runPrepare() {
    if (pipelineOrCooldownLocked || pending || !canPrepare) return;
    setLoadSession((s) => s + 1);
    setActive("prepare");
    setPipelineMode(false);
    setPanel("prepare", { phase: "loading" });
    startTransition(async () => {
      const res = await prepareLeadsAction({});
      setActive(null);
      if (!res.ok) {
        setPanel("prepare", { phase: "error", errorMessage: humanizeActionError(res.error) });
        startCooldown();
        router.refresh();
        return;
      }
      applyPrepareResult(res.data, true);
      startCooldown();
      router.refresh();
    });
  }

  function requestDispatch() {
    if (pipelineOrCooldownLocked || !canDispatch) return;
    if (pending) {
      setPanel("dispatch", {
        phase: "error",
        errorMessage: "Une autre action est encore en cours sur ce panneau. Attendez la fin ou quelques secondes.",
      });
      return;
    }
    setDispatchConfirmOpen(true);
  }

  function runDispatch() {
    setDispatchConfirmOpen(false);
    if (pipelineOrCooldownLocked || pending || !canDispatch) return;
    setLoadSession((s) => s + 1);
    setActive("dispatch");
    setPipelineMode(false);
    setPanel("dispatch", { phase: "loading" });
    startTransition(async () => {
      const res = await autoDispatchLeadsAction({});
      setActive(null);
      if (!res.ok) {
        const dmsg = humanizeActionError(res.error);
        if (
          dmsg === "Aucun lead prêt à distribuer." ||
          dmsg === "Aucun agent disponible pour la distribution."
        ) {
          const hint =
            dmsg === "Aucun agent disponible pour la distribution."
              ? "Aucun commercial éligible : ajoutez ou activez des commerciaux avant de distribuer."
              : "Aucun contact prêt à distribuer. Complétez les fiches et utilisez « Améliorer les leads ».";
          setPanel("dispatch", { phase: "empty", emptyHint: hint });
        } else {
          setPanel("dispatch", { phase: "error", errorMessage: dmsg });
        }
        startCooldown();
        router.refresh();
        return;
      }
      applyDispatchResult(res.data, true);
      startCooldown();
      router.refresh();
    });
  }

  const recoReady =
    pipelineSnapshot.leadsReadyToAssign > 0
      ? "Vous pouvez lancer la distribution automatique."
      : "Complétez les fiches avant de les confier aux commerciaux.";
  const recoImprove =
    pipelineSnapshot.leadsNeedingContactImprovement > 0
      ? "Lancez « Améliorer les leads »."
      : pipelineSnapshot.leadsStillBeingQualified > 0
        ? "Poursuivez les compléments puis relancez cette étape."
        : "Peu d’actions de complément urgentes sur ce stock.";
  const recoImports =
    pipelineSnapshot.importsRunning > 0
      ? "Import en cours : attendez la synchronisation."
      : "Aucun import actif pour l’instant.";

  const cockpitTitle = cockpitHeadlineFromStep(pipelineSnapshot.recommendedStep);

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full font-medium text-muted-foreground hover:text-foreground sm:w-auto"
            disabled={pipelineOrCooldownLocked || pending}
            onClick={openGenerateFlow}
          >
            Générer des leads qualifiés
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full border-border/80 bg-transparent font-medium sm:w-auto"
            disabled={pipelineOrCooldownLocked || pending || !canPipeline}
            onClick={handlePipelineButtonClick}
          >
            {pipelineBusy ? <Loader2 className="mr-2 size-3.5 shrink-0 animate-spin" aria-hidden /> : null}
            Enchaîner les 5 étapes
          </Button>
          <Link
            href="/lead-generation/imports"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex w-full justify-center border-border/60 bg-transparent font-medium text-muted-foreground hover:text-foreground sm:w-auto",
            )}
          >
            Importer CSV
          </Link>
        </div>
        {cooldownActive ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1.5 text-[11px] font-medium text-amber-100/95">
            Pause : {cooldownSecondsLeft}s
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Gauge className="size-3.5 text-muted-foreground opacity-80" aria-hidden />
          Cockpit
        </h2>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3.5">
        <p className="text-base font-semibold tracking-tight text-foreground">{cockpitTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {pipelineSnapshot.recommendedActionLabel}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          label="Prêts à distribuer"
          hint="Contacts exploitables tout de suite"
          value={pipelineSnapshot.leadsReadyToAssign}
          accent="emerald"
          recommendedAction={recoReady}
        />
        <SummaryTile
          label="Leads à améliorer"
          hint="Compléments utiles avant appel"
          value={pipelineSnapshot.leadsNeedingContactImprovement}
          accent="amber"
          recommendedAction={recoImprove}
          footer={
            pipelineSnapshot.leadsNeedingContactImprovement > 0 ? (
              <Link
                href={buildLeadGenerationStockQuickFiltreUrl("contact_gap")}
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "h-auto p-0 text-xs font-medium text-amber-900 underline-offset-4 hover:underline dark:text-amber-100",
                )}
              >
                Voir les {pipelineSnapshot.leadsNeedingContactImprovement} fiche
                {pipelineSnapshot.leadsNeedingContactImprovement > 1 ? "s" : ""} (liste complète)
              </Link>
            ) : null
          }
        />
        <SummaryTile
          label="Imports en cours"
          hint="Synchronisation fournisseur"
          value={pipelineSnapshot.importsRunning}
          accent="sky"
          recommendedAction={recoImports}
        />
      </div>

      {syncingImportBatches.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Import en cours. Les résultats apparaîtront dès que la synchronisation sera terminée.
          </p>
          <LeadGenerationSyncingImportsBanner batches={syncingImportBatches} />
        </div>
      ) : null}

      {pipelineBusy && pipelineMode ? (
        <div className="flex animate-in fade-in-0 slide-in-from-top-1 duration-300 items-center gap-3 rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-sm text-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Parcours unifié — 5 étapes (Maps → PJ → LinkedIn → améliorer → distribuer)</p>
            <p className="truncate text-[11px] text-muted-foreground">
              <span key={loadSession}>
                <LoadingTickerMessage actionId="generate" overrideSteps={UNIFIED_PIPELINE_LOADING_STEPS_LIST} />
              </span>
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <ActionColumn
          actionId="generate"
          title="Générer des leads qualifiés"
          description="Import, intégration au carnet et premiers compléments automatiques."
          visualWeight="quiet"
          teaserLines={
            lastCampaignLabel
              ? [`Dernière campagne : ${lastCampaignLabel}`]
              : ["Aucune campagne mémorisée sur cet appareil"]
          }
          buttonLabel="Générer des leads qualifiés"
          variant="outline"
          buttonSize="sm"
          pending={anyBusy}
          disabled={pipelineOrCooldownLocked || !canGenerate}
          note={
            !canGenerate ? (
              <p className="text-[10px] leading-snug text-amber-100/85">
                Beaucoup d’imports en cours — vous pouvez configurer, mais évitez de lancer tant qu’il reste plus de{" "}
                {IMPORT_BACKLOG_SOFT_CAP} lots actifs.
              </p>
            ) : null
          }
          isActive={active === "generate"}
          isPipelineLoading={pipelineBusy && pipelineMode}
          loadSession={loadSession}
          panel={panels.generate}
          lastRun={store.runs.generate}
          onRun={openGenerateFlow}
        />
        <ActionColumn
          actionId="prepare"
          title="Améliorer les leads"
          description="Complète email, site et décideurs, puis met à jour les contacts prêts à confier."
          visualWeight="mid"
          teaserLines={improveTeaserLines}
          buttonLabel="Améliorer les leads"
          variant="secondary"
          buttonSize="default"
          pending={anyBusy}
          disabled={pipelineOrCooldownLocked || !canPrepare}
          disableHint={
            !canPrepare ? "Aucune fiche disponible dans le carnet pour cette action." : undefined
          }
          isActive={active === "prepare"}
          isPipelineLoading={pipelineBusy && pipelineMode}
          loadSession={loadSession}
          panel={panels.prepare}
          lastRun={store.runs.prepare}
          onRun={runPrepare}
        />
        <ActionColumn
          actionId="dispatch"
          title="Distribuer automatiquement"
          description="Répartit les contacts prêts entre les commerciaux éligibles."
          visualWeight="hero"
          teaserLines={formatDispatchTeaserLines(
            pipelineSnapshot.leadsReadyToAssign,
            assignableAgentsCount,
          )}
          buttonLabel="Distribuer automatiquement"
          variant="default"
          buttonSize="lg"
          pending={anyBusy}
          disabled={pipelineOrCooldownLocked || !canDispatch}
          disableHint={
            !canDispatch
              ? "Aucun lead prêt à distribuer. Améliorez d’abord les fiches."
              : undefined
          }
          isActive={active === "dispatch"}
          isPipelineLoading={pipelineBusy && pipelineMode}
          loadSession={loadSession}
          panel={panels.dispatch}
          lastRun={store.runs.dispatch}
          onRun={requestDispatch}
        />
      </div>

      {store.runs.pipeline ? (
        <div className="animate-in fade-in-0 rounded-xl border border-border bg-muted/25 px-3.5 py-2.5 text-[11px] text-muted-foreground duration-300">
          <span className="font-medium text-foreground/90">Dernier enchaînement (parcours 5 étapes) : </span>
          {formatLastRunTime(store.runs.pipeline.at)} — {store.runs.pipeline.summary}
          {formatVolumeShort(store.runs.pipeline.volume)}
        </div>
      ) : null}

      <LeadGenerationGenerateCampaignModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        initialConfig={generateModalInitial}
        onLaunch={handleGenerateModalLaunch}
      />

      <Dialog open={generateConfirmOpen} onOpenChange={setGenerateConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la génération</DialogTitle>
            <DialogDescription>
              Vous réutilisez le dernier réglage enregistré sur cet appareil. Vérifiez le résumé avant de lancer.
            </DialogDescription>
          </DialogHeader>
          {generateConfirmConfig && generateConfirmPlan ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{generateConfirmConfig.campaignName}</p>
              <p className="text-muted-foreground">
                {generateConfirmConfig.sector} — {generateConfirmConfig.zone}
              </p>
              <p className="text-xs text-muted-foreground">
                {generateConfirmPlan.searchStrings.length} recherche
                {generateConfirmPlan.searchStrings.length > 1 ? "s" : ""} · ordre de grandeur ~
                {generateConfirmPlan.estimatedVolume} fiche{generateConfirmPlan.estimatedVolume > 1 ? "s" : ""}
              </p>
              {generateConfirmPlan.searchStrings.length === 0 ? (
                <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-50/95">
                  Veuillez configurer la recherche avant de lancer la génération.
                </p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setGenerateConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!generateConfirmConfig) return;
                setGenerateConfirmOpen(false);
                setGenerateIntent("standalone");
                setGenerateModalInitial(mergeGenerateCampaignConfig(generateConfirmConfig));
                setGenerateModalOpen(true);
              }}
            >
              Modifier le réglage
            </Button>
            <Button
              type="button"
              disabled={!generateConfirmPlan || generateConfirmPlan.searchStrings.length === 0 || pending}
              onClick={() => {
                if (!generateConfirmConfig || !generateConfirmPlan || generateConfirmPlan.searchStrings.length === 0) {
                  return;
                }
                setGenerateConfirmOpen(false);
                void runStandaloneGenerateFromPayload(generateConfirmConfig);
              }}
            >
              Lancer la génération
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dispatchConfirmOpen} onOpenChange={setDispatchConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Distribuer automatiquement</DialogTitle>
            <DialogDescription>
              Résumé avant attribution : les contacts prêts à être confiés sont répartis entre les commerciaux
              éligibles, dans la limite des plafonds.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {formatDispatchTeaserLines(pipelineSnapshot.leadsReadyToAssign, assignableAgentsCount).map((line, i) => (
              <li key={`${i}-${line.slice(0, 20)}`} className="flex gap-2">
                <span className="text-muted-foreground/50" aria-hidden>
                  ·
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {assignableAgentsCount === 0 ? (
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-50/95">
              Aucun commercial éligible pour la distribution. Ajoutez ou activez des commerciaux avant de lancer.
            </p>
          ) : null}
          {pipelineSnapshot.leadsReadyToAssign === 0 ? (
            <p className="rounded-md border border-border bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
              Aucun contact prêt à distribuer pour l’instant. Complétez les fiches puis utilisez « Améliorer les leads
              ».
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDispatchConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={pending || assignableAgentsCount === 0 || pipelineSnapshot.leadsReadyToAssign === 0}
              onClick={() => {
                void runDispatch();
              }}
            >
              Lancer la distribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pipelinePreflightOpen} onOpenChange={setPipelinePreflightOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enchaîner les 5 étapes</DialogTitle>
            <DialogDescription>
              Un réglage de campagne est mémorisé sur cet appareil. Le parcours complet exécute toujours dans l’ordre :
              carte (Maps), Pages Jaunes, LinkedIn, amélioration des fiches, puis distribution — sans sauter les
              enrichissements, même s’il reste des fiches à compléter ailleurs dans le carnet.
            </DialogDescription>
          </DialogHeader>
          {pipelinePreflightConfig ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{pipelinePreflightConfig.campaignName}</p>
              <p className="text-muted-foreground">
                {pipelinePreflightConfig.sector} — {pipelinePreflightConfig.zone}
              </p>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPipelinePreflightOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!pipelinePreflightConfig) return;
                setPipelinePreflightOpen(false);
                setGenerateIntent("pipeline");
                setGenerateModalInitial(mergeGenerateCampaignConfig(pipelinePreflightConfig));
                setGenerateModalOpen(true);
              }}
            >
              Modifier
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!pipelinePreflightConfig) return;
                setPipelinePreflightOpen(false);
                void runFullPipelineWithPayload(pipelinePreflightConfig);
              }}
            >
              Utiliser la dernière configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryTile({
  label,
  hint,
  value,
  accent,
  recommendedAction,
  footer,
}: {
  label: string;
  hint: string;
  value: number;
  accent: "emerald" | "amber" | "sky";
  recommendedAction: string;
  footer?: ReactNode;
}) {
  const topAccent =
    accent === "emerald"
      ? "border-t-emerald-400/45"
      : accent === "amber"
        ? "border-t-amber-400/45"
        : "border-t-sky-400/45";
  const tint =
    accent === "emerald"
      ? "bg-emerald-500/[0.06]"
      : accent === "amber"
        ? "bg-amber-500/[0.06]"
        : "bg-sky-500/[0.06]";
  return (
    <div
      className={cn(
        "rounded-xl border border-border border-t-2 bg-card px-3.5 pt-3 pb-3.5 shadow-sm",
        topAccent,
        tint,
      )}
    >
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      <p className="mt-3 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Recommandation</p>
      <p className="mt-0.5 text-xs leading-snug text-foreground/85">{recommendedAction}</p>
      {footer ? <div className="mt-2 border-t border-border/50 pt-2">{footer}</div> : null}
    </div>
  );
}

type BtnVariant = "default" | "secondary" | "outline";
type VisualWeight = "hero" | "mid" | "quiet";

function ActionColumn({
  actionId,
  title,
  description,
  teaserLines,
  buttonLabel,
  variant = "outline",
  visualWeight = "mid",
  buttonSize = "sm",
  pending,
  disabled,
  disableHint,
  note,
  isActive,
  isPipelineLoading,
  loadSession,
  panel,
  lastRun,
  onRun,
}: {
  actionId: ActionId;
  title: string;
  description: string;
  teaserLines?: string[];
  buttonLabel: string;
  variant?: BtnVariant;
  visualWeight?: VisualWeight;
  buttonSize?: "sm" | "default" | "lg";
  pending: boolean;
  disabled: boolean;
  disableHint?: string;
  /** Texte d’info affiché même si le bouton reste cliquable (ex. Générer + file imports). */
  note?: ReactNode;
  isActive: boolean;
  isPipelineLoading: boolean;
  loadSession: number;
  panel: PanelSnapshot;
  lastRun?: RunEntryV2;
  onRun: () => void;
}) {
  const isLoading = (pending && isActive) || isPipelineLoading;

  const shell =
    visualWeight === "hero"
      ? "border-primary/25 bg-card shadow-lg shadow-primary/10 ring-1 ring-primary/15"
      : visualWeight === "quiet"
        ? "border-border/70 bg-background/40"
        : "border-border bg-card";

  const titleClass =
    visualWeight === "hero"
      ? "text-lg font-semibold tracking-tight text-foreground"
      : visualWeight === "quiet"
        ? "text-sm font-semibold text-foreground/90"
        : "text-base font-semibold tracking-tight text-foreground";

  const buttonClass =
    visualWeight === "hero"
      ? "w-full font-semibold"
      : visualWeight === "quiet"
        ? "w-full border-border/80 font-medium"
        : "w-full font-semibold";

  return (
    <div className={cn("flex h-full min-h-[26rem] flex-col gap-2.5 rounded-xl border p-3.5 sm:min-h-[28rem]", shell)}>
      <div className="min-h-0 shrink-0">
        <p className={titleClass}>{title}</p>
        {description ? <p className="text-[11px] text-muted-foreground">{description}</p> : null}
        {teaserLines?.length ? (
          <ul className="mt-2 space-y-1 text-xs leading-snug text-muted-foreground">
            {teaserLines.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`} className="flex gap-1.5">
                <span className="text-muted-foreground/50" aria-hidden>
                  ·
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Button
        type="button"
        variant={variant}
        size={buttonSize}
        className={buttonClass}
        disabled={disabled || (pending && isActive)}
        onClick={onRun}
      >
        {isLoading ? <Loader2 className="mr-2 size-3.5 shrink-0 animate-spin" aria-hidden /> : null}
        {buttonLabel}
      </Button>
      {note && !pending ? <div className="shrink-0">{note}</div> : null}
      {disabled && !pending && disableHint ? (
        <p className="shrink-0 text-[10px] text-muted-foreground">{disableHint}</p>
      ) : null}

      <div className="flex min-h-[5.5rem] flex-1 flex-col rounded-lg border border-border/60 bg-background/35 p-2.5">
        <PanelBody
          actionId={actionId}
          phase={panel.phase}
          isLoading={isLoading}
          loadSession={loadSession}
          pipelineOverlay={isPipelineLoading}
          panel={panel}
        />
      </div>

      <div className="shrink-0 border-t border-border/50 pt-2.5 text-[10px] text-muted-foreground">
        <span className="font-medium tracking-wide text-muted-foreground uppercase">Dernier run</span>
        <span className="mt-1 block text-foreground/75">
          {lastRun ? (
            <>
              {formatLastRunTime(lastRun.at)} — {lastRun.summary}
              {formatVolumeShort(lastRun.volume)}
            </>
          ) : (
            "—"
          )}
        </span>
      </div>
    </div>
  );
}

function PanelBody({
  actionId,
  phase,
  isLoading,
  loadSession,
  pipelineOverlay,
  panel,
}: {
  actionId: ActionId;
  phase: PanelPhase;
  isLoading: boolean;
  loadSession: number;
  pipelineOverlay: boolean;
  panel: PanelSnapshot;
}) {
  if (isLoading) {
    return (
      <div className="flex animate-in fade-in-0 zoom-in-95 duration-300 flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
          <span key={`${actionId}-${loadSession}`}>
            {pipelineOverlay ? (
              <span className="text-[11px] text-muted-foreground">Exécution dans le pipeline complet…</span>
            ) : (
              <LoadingTickerMessage actionId={actionId} />
            )}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {pipelineOverlay
            ? "Les trois étapes métier s’enchaînent côté serveur. Merci de patienter."
            : "Traitement serveur en cours — étapes indicatives."}
        </p>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <p className="animate-in fade-in-0 py-1 text-[11px] text-muted-foreground duration-300">
        Détail du résultat après l’action.
      </p>
    );
  }

  if (phase === "error" && panel.errorMessage) {
    return (
      <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
          <OctagonAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{panel.errorMessage}</p>
        </div>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <CircleOff className="mt-0.5 size-4 shrink-0 text-amber-300/90" aria-hidden />
          <p>{panel.emptyHint ?? "Aucune action nécessaire pour l’instant."}</p>
        </div>
        {panel.banners?.length ? (
          <ul className="mt-2 space-y-1.5">
            {panel.banners.map((b, i) => (
              <li
                key={i}
                className={cn(
                  "rounded-md px-2 py-1.5 text-[11px]",
                  b.tone === "info" && "bg-primary/10 text-foreground/95",
                  b.tone === "warning" && "bg-amber-500/12 text-amber-50/95",
                )}
              >
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (phase === "success" && panel.rows?.length) {
    return (
      <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-emerald-300/95">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Terminé
        </div>
        {panel.businessNote ? (
          <p className="mb-2 rounded-md border border-primary/15 bg-primary/10 px-2 py-1.5 text-[11px] leading-snug text-foreground/95">
            {panel.businessNote}
          </p>
        ) : null}
        <dl className="space-y-1.5 text-xs">
          {panel.rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className="flex justify-between gap-3 border-b border-border/40 pb-1.5 last:border-0"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium tabular-nums text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
        {panel.banners?.length ? (
          <ul className="mt-3 space-y-1.5">
            {panel.banners.map((b, i) => (
              <li
                key={i}
                className={cn(
                  "rounded-md px-2 py-1.5 text-[11px] leading-snug",
                  b.tone === "info" && "bg-primary/10 text-foreground/95",
                  b.tone === "warning" && "bg-amber-500/12 text-amber-50/95",
                )}
              >
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <p className="animate-in fade-in-0 text-[11px] text-muted-foreground duration-300">
      En attente de résultat…
    </p>
  );
}
