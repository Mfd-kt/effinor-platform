"use client";

import type { LeadGenerationCeeImportScope } from "../queries/get-lead-generation-cee-import-scope";
import type { GenerateCampaignStoredConfig } from "../lib/generate-campaign-storage";

export type LeadGenerationGenerateCampaignModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig: GenerateCampaignStoredConfig;
  onLaunch: (payload: GenerateCampaignStoredConfig) => Promise<{ ok: boolean; error?: string }>;
  ceeScope: LeadGenerationCeeImportScope;
  variant?: "default" | "mapsOnly";
};

// TODO: Reimplement when new lead-gen sources (Pages Jaunes / Le Bon Coin) replace Apify Google Maps.
export function LeadGenerationGenerateCampaignModal(_props: LeadGenerationGenerateCampaignModalProps) {
  return null;
}
