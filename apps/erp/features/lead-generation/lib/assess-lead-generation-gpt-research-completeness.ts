import type {
  LeadGenerationGptResearchInput,
  LeadGenerationGptResearchPhase1Payload,
  LeadGenerationGptSourceRef,
} from "../domain/lead-generation-gpt-research";

export type LeadGenerationGptResearchCompletenessAssessment = {
  isComplete: boolean;
  hasDecisionMaker: boolean;
  hasEnoughSources: boolean;
  hasLinkedinLikeSource: boolean;
  hasPappersFrSource: boolean;
  hasWebsiteDomainSource: boolean;
  hasTrustedSource: boolean;
  shouldRetryDecisionMakerSearch: boolean;
  warnings: string[];
};

function normalizeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function sourceMatchesLeadWebsite(sources: LeadGenerationGptSourceRef[], input: LeadGenerationGptResearchInput): boolean {
  const raw = input.normalized_domain?.trim().toLowerCase().replace(/^www\./, "");
  if (!raw) return false;
  return sources.some((s) => {
    const h = normalizeHost(s.url);
    if (!h) return false;
    return h === raw || h.endsWith(`.${raw}`);
  });
}

function isVagueQualificationReason(reason: string): boolean {
  const t = reason.trim();
  if (t.length < 45) return true;
  const head = t.slice(0, 40).toLowerCase();
  const vague =
    /^(informations|données|recherche|insuffisant|aucune|non disponible|inconnu|pas disponible|n\/a|non trouvé|pas de)/i;
  return vague.test(head);
}

/**
 * Garde-fous serveur après phase 1 (et éventuellement retry décideur).
 */
export function assessLeadGenerationGptResearchCompleteness(
  payload: LeadGenerationGptResearchPhase1Payload,
  input: LeadGenerationGptResearchInput,
  opts: { hasRetriedDecisionMaker: boolean },
): LeadGenerationGptResearchCompletenessAssessment {
  const warnings: string[] = [];

  const hasDecisionMaker = payload.decision_maker.name.trim().length > 0;
  const hasEnoughSources = payload.sources.length >= 3;

  const lowerUrls = payload.sources.map((s) => s.url.toLowerCase());
  const hasLinkedinLikeSource = lowerUrls.some((u) => u.includes("linkedin.com"));
  const hasPappersFrSource = lowerUrls.some((u) => u.includes("pappers.fr"));
  const hasWebsiteDomainSource = sourceMatchesLeadWebsite(payload.sources, input);
  const hasTrustedSource = hasLinkedinLikeSource || hasPappersFrSource || hasWebsiteDomainSource;

  if (!hasDecisionMaker) {
    warnings.push("Aucun nom de décideur exploitable identifié.");
  }
  if (!hasEnoughSources) {
    warnings.push(`Moins de 3 sources distinctes (${payload.sources.length}).`);
  }
  if (!hasTrustedSource) {
    warnings.push("Aucune source de type LinkedIn, Pappers ou site officiel du lead parmi les URLs citées.");
  }
  if (isVagueQualificationReason(payload.qualification_reason)) {
    warnings.push("Justification de qualification trop vague ou trop courte.");
  }
  if (payload.sector === "unknown" && payload.building_type === "unknown") {
    warnings.push("Secteur et type de bâtiment restent inconnus.");
  }

  const isComplete =
    hasDecisionMaker &&
    hasEnoughSources &&
    hasTrustedSource &&
    !isVagueQualificationReason(payload.qualification_reason) &&
    !(payload.sector === "unknown" && payload.building_type === "unknown");

  const shouldRetryDecisionMakerSearch =
    !opts.hasRetriedDecisionMaker &&
    (!hasDecisionMaker || !hasEnoughSources || !hasTrustedSource);

  return {
    isComplete,
    hasDecisionMaker,
    hasEnoughSources,
    hasLinkedinLikeSource,
    hasPappersFrSource,
    hasWebsiteDomainSource,
    hasTrustedSource,
    shouldRetryDecisionMakerSearch,
    warnings,
  };
}
