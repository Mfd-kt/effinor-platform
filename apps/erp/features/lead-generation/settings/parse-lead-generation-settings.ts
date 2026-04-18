import { z } from "zod";

import {
  DEFAULT_LEAD_GENERATION_SETTINGS,
  LEAD_GENERATION_SETTINGS_KEYS,
  type AutomationLimitsSettings,
  type CommercialScoringSettings,
  type DispatchQueueRulesSettings,
  type LeadGenerationSettings,
  type LeadGenerationSettingsKey,
  type MainActionsDefaultsSettings,
  type RecyclingRulesSettings,
  type UiBatchLimitsSettings,
} from "./default-settings";

const int = (min: number, max: number) => z.number().int().min(min).max(max);

export const commercialScoringSettingsSchema = z
  .object({
    priority_low_max: int(0, 100),
    priority_normal_min: int(0, 100),
    priority_high_min: int(0, 100),
    priority_critical_min: int(0, 100),
  })
  .superRefine((v, ctx) => {
    if (!(v.priority_low_max < v.priority_normal_min)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "priority_low_max doit être < priority_normal_min.",
      });
    }
    if (!(v.priority_normal_min <= v.priority_high_min && v.priority_high_min <= v.priority_critical_min)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ordre invalide: normal <= high <= critical.",
      });
    }
  });

export const dispatchQueueRulesSettingsSchema = z
  .object({
    score_ready_min: int(0, 100),
    score_ready_strong: int(0, 100),
    score_low_band: int(0, 100),
    score_enrich_floor: int(0, 100),
  })
  .superRefine((v, ctx) => {
    if (v.score_ready_strong < v.score_ready_min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "score_ready_strong doit être >= score_ready_min.",
      });
    }
    if (v.score_enrich_floor > v.score_low_band) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "score_enrich_floor doit être <= score_low_band.",
      });
    }
  });

export const recyclingRulesSettingsSchema = z.object({
  days_assigned_without_open: int(1, 90),
  days_silence_after_last_touch: int(1, 180),
  min_attempts_for_recycle: int(1, 100),
});

export const automationLimitsSettingsSchema = z.object({
  sync_pending_imports_limit: int(1, 50),
  score_recent_stock_limit: int(1, 100),
  evaluate_dispatch_queue_limit: int(1, 100),
  evaluate_recycling_limit: int(1, 100),
});

export const uiBatchLimitsSettingsSchema = z.object({
  quick_score_limit: int(1, 100),
  quick_enrichment_limit: int(1, 100),
  quick_dispatch_queue_limit: int(1, 100),
  quick_recycling_limit: int(1, 100),
});

const trimmedNullable = z
  .string()
  .max(200)
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null) return null;
    const t = v.trim();
    return t.length === 0 ? null : t;
  });

export const mainActionsDefaultsSettingsSchema = z.object({
  apify: z.object({
    search_strings: z
      .array(z.string().trim().min(1, "Recherche non vide.").max(200))
      .min(1, "Au moins une recherche.")
      .max(20, "Maximum 20 recherches."),
    max_crawled_places_per_search: int(1, 500),
    include_web_results: z.boolean(),
    location_query: trimmedNullable,
  }),
  post_import_enrich_limit: int(1, 100),
  prepare_batch_limit: int(1, 100),
  agent_stock_cap: int(1, 100),
});

export const leadGenerationSettingsKeySchema = z.enum(LEAD_GENERATION_SETTINGS_KEYS);

export function parseCommercialScoringSettings(
  value: unknown,
): { value: CommercialScoringSettings; valid: boolean } {
  const parsed = commercialScoringSettingsSchema.safeParse(value);
  return parsed.success
    ? { value: parsed.data, valid: true }
    : { value: DEFAULT_LEAD_GENERATION_SETTINGS.commercialScoring, valid: false };
}

export function parseDispatchQueueRulesSettings(
  value: unknown,
): { value: DispatchQueueRulesSettings; valid: boolean } {
  const parsed = dispatchQueueRulesSettingsSchema.safeParse(value);
  return parsed.success
    ? { value: parsed.data, valid: true }
    : { value: DEFAULT_LEAD_GENERATION_SETTINGS.dispatchQueueRules, valid: false };
}

export function parseRecyclingRulesSettings(
  value: unknown,
): { value: RecyclingRulesSettings; valid: boolean } {
  const parsed = recyclingRulesSettingsSchema.safeParse(value);
  return parsed.success
    ? { value: parsed.data, valid: true }
    : { value: DEFAULT_LEAD_GENERATION_SETTINGS.recyclingRules, valid: false };
}

export function parseAutomationLimitsSettings(
  value: unknown,
): { value: AutomationLimitsSettings; valid: boolean } {
  const parsed = automationLimitsSettingsSchema.safeParse(value);
  return parsed.success
    ? { value: parsed.data, valid: true }
    : { value: DEFAULT_LEAD_GENERATION_SETTINGS.automationLimits, valid: false };
}

export function parseUiBatchLimitsSettings(
  value: unknown,
): { value: UiBatchLimitsSettings; valid: boolean } {
  const parsed = uiBatchLimitsSettingsSchema.safeParse(value);
  return parsed.success
    ? { value: parsed.data, valid: true }
    : { value: DEFAULT_LEAD_GENERATION_SETTINGS.uiBatchLimits, valid: false };
}

export function parseMainActionsDefaultsSettings(
  value: unknown,
): { value: MainActionsDefaultsSettings; valid: boolean } {
  const parsed = mainActionsDefaultsSettingsSchema.safeParse(value);
  return parsed.success
    ? { value: parsed.data, valid: true }
    : { value: DEFAULT_LEAD_GENERATION_SETTINGS.mainActionsDefaults, valid: false };
}

export function parseLeadGenerationSettingByKey(key: LeadGenerationSettingsKey, value: unknown) {
  switch (key) {
    case "commercial_scoring":
      return parseCommercialScoringSettings(value);
    case "dispatch_queue_rules":
      return parseDispatchQueueRulesSettings(value);
    case "recycling_rules":
      return parseRecyclingRulesSettings(value);
    case "automation_limits":
      return parseAutomationLimitsSettings(value);
    case "ui_batch_limits":
      return parseUiBatchLimitsSettings(value);
    case "main_actions_defaults":
      return parseMainActionsDefaultsSettings(value);
  }
}

export function mapSettingsForStorage(input: LeadGenerationSettings): Record<LeadGenerationSettingsKey, unknown> {
  return {
    commercial_scoring: input.commercialScoring,
    dispatch_queue_rules: input.dispatchQueueRules,
    recycling_rules: input.recyclingRules,
    automation_limits: input.automationLimits,
    ui_batch_limits: input.uiBatchLimits,
    main_actions_defaults: input.mainActionsDefaults,
  };
}
