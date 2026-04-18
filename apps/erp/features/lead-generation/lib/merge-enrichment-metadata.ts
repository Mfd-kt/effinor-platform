import type { Json } from "../domain/json";

export type LeadGenerationEnrichmentMetadata = {
  linkedin_candidate_reason?: string;
  linkedin_batch_id?: string;
  linkedin_synced_at?: string;
  [key: string]: unknown;
};

export function parseEnrichmentMetadata(raw: unknown): LeadGenerationEnrichmentMetadata {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as LeadGenerationEnrichmentMetadata;
}

export function mergeEnrichmentMetadata(
  existing: unknown,
  patch: LeadGenerationEnrichmentMetadata,
): Json {
  const base = parseEnrichmentMetadata(existing);
  return { ...base, ...patch } as Json;
}
