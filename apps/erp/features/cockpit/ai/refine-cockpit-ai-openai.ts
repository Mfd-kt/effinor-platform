import OpenAI from "openai";

import type { CockpitAiContext } from "./cockpit-ai-types";
import type { CockpitAiRecommendation } from "../types";

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const SYSTEM = `Tu es un directeur des opérations CEE. Tu reçois un JSON "recommendations" (id, titres, descriptions déjà basés sur des données réelles) et un "context" résumé.
Réponds UNIQUEMENT avec un JSON valide :
{
  "order": string[],
  "tweaks": Record<string, { "title"?: string, "description"?: string }>
}
Règles :
- "order" doit contenir exactement les mêmes id que les recommandations, une seule fois chacune, ordre = priorité d’exécution.
- "tweaks" : clés = id ; tu peux seulement raccourcir ou clarifier title/description en français. Ne invente pas de chiffres.
- Ne modifie pas les href, montants ou entités : seulement texte d’affichage.`;

export async function refineCockpitAiRecommendationsWithOpenAI(
  ctx: CockpitAiContext,
  recs: CockpitAiRecommendation[],
): Promise<CockpitAiRecommendation[] | null> {
  if (recs.length === 0) return recs;
  const client = getClient();
  if (!client) return null;

  const ids = new Set(recs.map((r) => r.id));
  const slim = recs.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    category: r.category,
    impactEuro: r.impactEuro,
  }));

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_COCKPIT_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.25,
      max_tokens: 1_800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            context: {
              summary: ctx.summary,
              generatedAt: ctx.generatedAt,
            },
            recommendations: slim,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      order?: string[];
      tweaks?: Record<string, { title?: string; description?: string }>;
    };
    const order = Array.isArray(parsed.order) ? parsed.order : [];
    if (order.length !== ids.size || !order.every((id) => ids.has(id))) {
      return null;
    }
    const byId = new Map(recs.map((r) => [r.id, r] as const));
    const tweaks = parsed.tweaks && typeof parsed.tweaks === "object" ? parsed.tweaks : {};
    const merged = order.map((id) => {
      const base = byId.get(id)!;
      const t = tweaks[id];
      if (!t) return { ...base };
      return {
        ...base,
        title: typeof t.title === "string" && t.title.trim() ? t.title.trim().slice(0, 140) : base.title,
        description:
          typeof t.description === "string" && t.description.trim()
            ? t.description.trim().slice(0, 280)
            : base.description,
      };
    });
    return merged;
  } catch (e) {
    console.error("[refineCockpitAiRecommendationsWithOpenAI]", e);
    return null;
  }
}
