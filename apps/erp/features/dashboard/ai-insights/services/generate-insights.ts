import OpenAI from "openai";

import type { AiInsightAudience, AiInsightResult, AnyInsightContext } from "@/features/dashboard/ai-insights/domain/types";
import {
  heuristicAdminInsights,
  heuristicDirectorInsights,
} from "@/features/dashboard/ai-insights/lib/heuristic-insights";

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const SYSTEM = `Tu es un directeur des opérations CEE pour un ERP B2B. Tu reçois un JSON de métriques cockpit (période, funnel, alertes, segments).
Tu DOIS répondre uniquement avec un JSON valide aux clés :
{
  "summary": string (2-3 phrases max, français),
  "findings": string[] (3 à 5 constats chiffrés et factuels, français),
  "priorities": string[] (3 à 5 priorités actionnables),
  "recommendations": string[] (3 à 5 recommandations concrètes),
  "risks": string[] (0 à 5 risques si pertinents)
}
Ne invente pas de chiffres absents du contexte. Cite les segments (fiche, équipe, canal) quand tu t’appuies sur eux.`;

function heuristicForAudience(ctx: AnyInsightContext): AiInsightResult {
  if (ctx.audience === "admin") return heuristicAdminInsights(ctx);
  return heuristicDirectorInsights(ctx);
}

export async function generateAiInsights(
  ctx: AnyInsightContext,
  audience: AiInsightAudience,
): Promise<AiInsightResult> {
  const fallback = heuristicForAudience(ctx);
  const client = getClient();
  if (!client) {
    return fallback;
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_COCKPIT_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Audience: ${audience}\nContexte JSON:\n${JSON.stringify(ctx)}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AiInsightResult>;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
      findings: Array.isArray(parsed.findings) ? parsed.findings.slice(0, 5) : fallback.findings,
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.slice(0, 5) : fallback.priorities,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 5)
        : fallback.recommendations,
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 5) : fallback.risks,
      heuristicOnly: false,
    };
  } catch (e) {
    console.error("[generateAiInsights]", e);
    return fallback;
  }
}
