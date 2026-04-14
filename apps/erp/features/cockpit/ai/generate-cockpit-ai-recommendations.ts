import { buildCockpitAiContext, type CockpitDataForAi } from "./build-cockpit-ai-context";
import { buildCockpitAiRecommendationsFallback } from "./cockpit-ai-fallback";
import { refineCockpitAiRecommendationsWithOpenAI } from "./refine-cockpit-ai-openai";
import { sortAiRecommendations } from "./cockpit-ai-priority";
import type { CockpitAiRecommendation } from "../types";

export async function generateCockpitAiRecommendations(data: CockpitDataForAi): Promise<{
  recommendations: CockpitAiRecommendation[];
  heuristicOnly: boolean;
}> {
  const ctx = buildCockpitAiContext(data);
  let recommendations = buildCockpitAiRecommendationsFallback(ctx, data);
  recommendations = sortAiRecommendations(recommendations);

  const refined = await refineCockpitAiRecommendationsWithOpenAI(ctx, recommendations);
  if (refined) {
    return { recommendations: refined.slice(0, 10), heuristicOnly: false };
  }
  return { recommendations: recommendations.slice(0, 10), heuristicOnly: true };
}
