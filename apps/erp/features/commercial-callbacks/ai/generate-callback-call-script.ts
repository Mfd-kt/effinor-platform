import { buildCallbackAiContext } from "@/features/commercial-callbacks/ai/build-callback-ai-context";
import { fallbackCallbackCallScript } from "@/features/commercial-callbacks/ai/callback-ai-fallback";
import { CALLBACK_SCRIPT_SYSTEM } from "@/features/commercial-callbacks/ai/callback-ai-prompts";
import { getCallbackOpenAI, getCallbackOpenAIModel } from "@/features/commercial-callbacks/ai/callback-openai-client";
import type { CallbackAiExtra } from "@/features/commercial-callbacks/ai/callback-ai-types";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function normalizeLines(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const lines = raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((s) => s.length > 0);
  if (lines.length < 3 || lines.length > 6) return null;
  return lines;
}

/**
 * Génère un script d’appel (OpenAI si clé présente, sinon fallback métier).
 */
export async function generateCallbackCallScript(
  row: CommercialCallbackRow,
  extra?: CallbackAiExtra,
): Promise<{ scriptText: string; source: "openai" | "fallback" }> {
  const ctx = buildCallbackAiContext(row, extra);
  const openai = getCallbackOpenAI();
  if (!openai) {
    const { lines } = fallbackCallbackCallScript(ctx);
    return { scriptText: lines.join("\n"), source: "fallback" };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: getCallbackOpenAIModel(),
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CALLBACK_SCRIPT_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            context: ctx,
            instruction: "Produis le JSON demandé. Les lines doivent être 3 à 6 phrases complètes.",
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty_completion");
    const parsed = JSON.parse(raw) as { lines?: unknown };
    const lines = normalizeLines(parsed.lines);
    if (lines) {
      return { scriptText: lines.join("\n"), source: "openai" };
    }

    const fb = fallbackCallbackCallScript(ctx);
    return { scriptText: fb.lines.join("\n"), source: "fallback" };
  } catch (e) {
    console.error("[generateCallbackCallScript]", e);
    const fb = fallbackCallbackCallScript(ctx);
    return { scriptText: fb.lines.join("\n"), source: "fallback" };
  }
}
