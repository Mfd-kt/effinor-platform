import type { z } from "zod";

import { generateAndEnrichLeadsActionInputSchema } from "../schemas/lead-generation-actions.schema";
import { getDefaultGenerateCampaignConfig } from "./generate-campaign";

export type GenerateCampaignStoredConfig = z.infer<typeof generateAndEnrichLeadsActionInputSchema>;

export function mergeGenerateCampaignConfig(
  partial: Partial<GenerateCampaignStoredConfig> | null | undefined,
): GenerateCampaignStoredConfig {
  const base = getDefaultGenerateCampaignConfig();
  if (!partial) return base as GenerateCampaignStoredConfig;
  return { ...base, ...partial } as GenerateCampaignStoredConfig;
}

const LAST_KEY = "lg-generate-campaign:last";
const PRESETS_KEY = "lg-generate-campaign:presets";
const LAST_VERSION = 1 as const;

type LastEnvelope = { v: typeof LAST_VERSION; savedAt: number; config: GenerateCampaignStoredConfig };

type PresetEnvelope = {
  v: typeof LAST_VERSION;
  presets: { name: string; savedAt: number; config: GenerateCampaignStoredConfig }[];
};

function safeParseLast(raw: string | null): GenerateCampaignStoredConfig | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as LastEnvelope;
    if (p?.v !== LAST_VERSION || !p.config) return null;
    return p.config;
  } catch {
    return null;
  }
}

export function readLastGenerateCampaignConfig(): GenerateCampaignStoredConfig | null {
  if (typeof window === "undefined") return null;
  return safeParseLast(window.localStorage.getItem(LAST_KEY));
}

export function writeLastGenerateCampaignConfig(config: GenerateCampaignStoredConfig): void {
  if (typeof window === "undefined") return;
  try {
    const env: LastEnvelope = { v: LAST_VERSION, savedAt: Date.now(), config };
    window.localStorage.setItem(LAST_KEY, JSON.stringify(env));
  } catch {
    /* quota */
  }
}

export function readGenerateCampaignPresets(): { name: string; savedAt: number; config: GenerateCampaignStoredConfig }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as PresetEnvelope;
    if (p?.v !== LAST_VERSION || !Array.isArray(p.presets)) return [];
    return p.presets.filter((x) => x?.name && x.config);
  } catch {
    return [];
  }
}

export function appendGenerateCampaignPreset(
  name: string,
  config: GenerateCampaignStoredConfig,
  maxPresets = 12,
): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    const prev = readGenerateCampaignPresets();
    const next = [{ name: trimmed, savedAt: Date.now(), config }, ...prev.filter((p) => p.name !== trimmed)].slice(
      0,
      maxPresets,
    );
    const env: PresetEnvelope = { v: LAST_VERSION, presets: next };
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(env));
  } catch {
    /* quota */
  }
}
