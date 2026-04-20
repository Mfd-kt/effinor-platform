import type { LeadGenerationGptPappersMatch, LeadGenerationGptPappersEnrichment } from "../domain/lead-generation-gpt-research";

/**
 * Les identifiants et données légales Pappers viennent du serveur : ils priment sur le JSON modèle.
 */
export function mergeLeadGenerationGptResearchWithPappers<T extends { pappers_match: LeadGenerationGptPappersMatch }>(
  gpt: T,
  pappers: LeadGenerationGptPappersEnrichment,
): T {
  return {
    ...gpt,
    pappers_match: pappers.match,
  };
}
