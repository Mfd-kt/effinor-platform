import type {
  LeadGenerationGptResearchDecisionMakerRetryPayload,
  LeadGenerationGptResearchPayload,
  LeadGenerationGptResearchPhase1Payload,
  LeadGenerationGptResearchPhase2Payload,
} from "../domain/lead-generation-gpt-research";

export function mergeLeadGenerationGptResearchPhase1AndPhase2(
  phase1: LeadGenerationGptResearchPhase1Payload,
  phase2: LeadGenerationGptResearchPhase2Payload,
): LeadGenerationGptResearchPayload {
  return { ...phase1, ...phase2 };
}

export function mergeLeadGenerationGptResearchDecisionMakerRetryIntoPhase1(
  phase1: LeadGenerationGptResearchPhase1Payload,
  retry: LeadGenerationGptResearchDecisionMakerRetryPayload,
): LeadGenerationGptResearchPhase1Payload {
  const seen = new Set(phase1.sources.map((s) => s.url));
  const mergedSources = [...phase1.sources];
  for (const s of retry.sources) {
    if (!seen.has(s.url)) {
      mergedSources.push(s);
      seen.add(s.url);
    }
  }

  const useRetryDm = retry.decision_maker.name.trim().length > 0;

  return {
    ...phase1,
    decision_maker: useRetryDm ? retry.decision_maker : phase1.decision_maker,
    sources: mergedSources,
  };
}
