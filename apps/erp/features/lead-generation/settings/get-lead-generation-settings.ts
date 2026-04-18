import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import { DEFAULT_LEAD_GENERATION_SETTINGS, type LeadGenerationSettings, type LeadGenerationSettingsKey } from "./default-settings";
import {
  parseAutomationLimitsSettings,
  parseCommercialScoringSettings,
  parseDispatchQueueRulesSettings,
  parseMainActionsDefaultsSettings,
  parseRecyclingRulesSettings,
  parseUiBatchLimitsSettings,
} from "./parse-lead-generation-settings";

type SettingsDbRow = {
  key: LeadGenerationSettingsKey;
  value: unknown;
};

export type LeadGenerationSettingsReadResult = {
  settings: LeadGenerationSettings;
  invalidKeys: LeadGenerationSettingsKey[];
  missingKeys: LeadGenerationSettingsKey[];
};

function fromRows(rows: SettingsDbRow[]): LeadGenerationSettingsReadResult {
  const byKey = new Map<LeadGenerationSettingsKey, unknown>();
  for (const row of rows) {
    byKey.set(row.key, row.value);
  }

  const invalidKeys: LeadGenerationSettingsKey[] = [];
  const missingKeys: LeadGenerationSettingsKey[] = [];

  const commercial = byKey.get("commercial_scoring");
  const dispatch = byKey.get("dispatch_queue_rules");
  const recycling = byKey.get("recycling_rules");
  const automation = byKey.get("automation_limits");
  const ui = byKey.get("ui_batch_limits");
  const mainActions = byKey.get("main_actions_defaults");

  const pCommercial = parseCommercialScoringSettings(commercial);
  const pDispatch = parseDispatchQueueRulesSettings(dispatch);
  const pRecycling = parseRecyclingRulesSettings(recycling);
  const pAutomation = parseAutomationLimitsSettings(automation);
  const pUi = parseUiBatchLimitsSettings(ui);
  const pMainActions = parseMainActionsDefaultsSettings(mainActions);

  if (!pCommercial.valid) invalidKeys.push("commercial_scoring");
  if (!pDispatch.valid) invalidKeys.push("dispatch_queue_rules");
  if (!pRecycling.valid) invalidKeys.push("recycling_rules");
  if (!pAutomation.valid) invalidKeys.push("automation_limits");
  if (!pUi.valid) invalidKeys.push("ui_batch_limits");
  if (!pMainActions.valid) invalidKeys.push("main_actions_defaults");

  if (commercial === undefined) missingKeys.push("commercial_scoring");
  if (dispatch === undefined) missingKeys.push("dispatch_queue_rules");
  if (recycling === undefined) missingKeys.push("recycling_rules");
  if (automation === undefined) missingKeys.push("automation_limits");
  if (ui === undefined) missingKeys.push("ui_batch_limits");
  if (mainActions === undefined) missingKeys.push("main_actions_defaults");

  return {
    settings: {
      commercialScoring: pCommercial.value,
      dispatchQueueRules: pDispatch.value,
      recyclingRules: pRecycling.value,
      automationLimits: pAutomation.value,
      uiBatchLimits: pUi.value,
      mainActionsDefaults: pMainActions.value,
    },
    invalidKeys,
    missingKeys,
  };
}

export async function getLeadGenerationSettings(): Promise<LeadGenerationSettingsReadResult> {
  const supabase = await createClient();
  const table = lgTable(supabase, "lead_generation_settings");
  const { data, error } = await table.select("key, value");
  if (error) {
    console.warn("[lead-generation/settings] read failed, fallback to defaults:", error.message);
    return {
      settings: DEFAULT_LEAD_GENERATION_SETTINGS,
      invalidKeys: [],
      missingKeys: [
        "commercial_scoring",
        "dispatch_queue_rules",
        "recycling_rules",
        "automation_limits",
        "ui_batch_limits",
        "main_actions_defaults",
      ],
    };
  }
  return fromRows((data ?? []) as SettingsDbRow[]);
}
