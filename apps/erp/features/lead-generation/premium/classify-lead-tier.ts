import type { LeadGenerationLeadTier } from "../domain/lead-tier";

/** Seuils métier : premium doit rester rare. */
export function classifyLeadTierFromPremiumScore(score: number): LeadGenerationLeadTier {
  if (score >= 70) return "premium";
  if (score >= 35) return "workable";
  return "raw";
}
