export const LEAD_GENERATION_SETTINGS_KEYS = [
  "commercial_scoring",
  "dispatch_queue_rules",
  "recycling_rules",
  "automation_limits",
  "ui_batch_limits",
  "main_actions_defaults",
] as const;

export type LeadGenerationSettingsKey = (typeof LEAD_GENERATION_SETTINGS_KEYS)[number];

export type CommercialScoringSettings = {
  priority_low_max: number;
  priority_normal_min: number;
  priority_high_min: number;
  priority_critical_min: number;
};

export type DispatchQueueRulesSettings = {
  score_ready_min: number;
  score_ready_strong: number;
  score_low_band: number;
  score_enrich_floor: number;
};

export type RecyclingRulesSettings = {
  days_assigned_without_open: number;
  days_silence_after_last_touch: number;
  min_attempts_for_recycle: number;
};

export type AutomationLimitsSettings = {
  sync_pending_imports_limit: number;
  score_recent_stock_limit: number;
  evaluate_dispatch_queue_limit: number;
  evaluate_recycling_limit: number;
};

export type UiBatchLimitsSettings = {
  quick_score_limit: number;
  quick_enrichment_limit: number;
  quick_dispatch_queue_limit: number;
  quick_recycling_limit: number;
};

/** Valeurs par défaut des 3 actions principales (générer / préparer / dispatch) — étape « main actions ». */
export type MainActionsDefaultsSettings = {
  apify: {
    search_strings: string[];
    max_crawled_places_per_search: number;
    include_web_results: boolean;
    /** Chaîne vide ou null → zone par défaut serveur (France métropolitaine). */
    location_query: string | null;
  };
  /** Enrichissement rapide après import (borne 50 côté enrich). */
  post_import_enrich_limit: number;
  /** Taille du lot « Préparer les leads » (score + file). */
  prepare_batch_limit: number;
  /** Plafond de fiches actives par agent pour l’auto-dispatch. */
  agent_stock_cap: number;
};

export type LeadGenerationSettings = {
  commercialScoring: CommercialScoringSettings;
  dispatchQueueRules: DispatchQueueRulesSettings;
  recyclingRules: RecyclingRulesSettings;
  automationLimits: AutomationLimitsSettings;
  uiBatchLimits: UiBatchLimitsSettings;
  mainActionsDefaults: MainActionsDefaultsSettings;
};

export const DEFAULT_LEAD_GENERATION_SETTINGS: LeadGenerationSettings = {
  commercialScoring: {
    priority_low_max: 29,
    priority_normal_min: 30,
    priority_high_min: 55,
    priority_critical_min: 75,
  },
  dispatchQueueRules: {
    score_ready_min: 55,
    score_ready_strong: 72,
    score_low_band: 30,
    /** Plancher pour autoriser la diffusion sans enrichissement complet (0 = seul le plafond « low band » + téléphone s’applique). */
    score_enrich_floor: 0,
  },
  recyclingRules: {
    days_assigned_without_open: 7,
    days_silence_after_last_touch: 14,
    min_attempts_for_recycle: 12,
  },
  automationLimits: {
    sync_pending_imports_limit: 10,
    score_recent_stock_limit: 50,
    evaluate_dispatch_queue_limit: 50,
    evaluate_recycling_limit: 50,
  },
  uiBatchLimits: {
    quick_score_limit: 100,
    quick_enrichment_limit: 100,
    quick_dispatch_queue_limit: 100,
    quick_recycling_limit: 100,
  },
  mainActionsDefaults: {
    apify: {
      search_strings: ["Plombier", "Électricien", "Couvreur"],
      max_crawled_places_per_search: 50,
      include_web_results: false,
      location_query: null,
    },
    post_import_enrich_limit: 100,
    prepare_batch_limit: 100,
    agent_stock_cap: 100,
  },
};
