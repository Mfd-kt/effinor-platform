import { buildCallbackAiContext } from "@/features/commercial-callbacks/ai/build-callback-ai-context";
import { fallbackCallbackFollowupDraft } from "@/features/commercial-callbacks/ai/callback-ai-fallback";
import { CALLBACK_FOLLOWUP_SYSTEM } from "@/features/commercial-callbacks/ai/callback-ai-prompts";
import { getCallbackOpenAI, getCallbackOpenAIModel } from "@/features/commercial-callbacks/ai/callback-openai-client";
import type { CallbackAiExtra } from "@/features/commercial-callbacks/ai/callback-ai-types";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function buildDraftText(subject: string, message: string, cta: string): string {
  return `Objet : ${subject}\n\n${message}\n\n— ${cta}`;
}

/**
 * Génère un brouillon de relance (OpenAI si clé présente, sinon fallback métier).
 */
export async function generateCallbackFollowupDraft(
  row: CommercialCallbackRow,
  extra?: CallbackAiExtra,
): Promise<{ draftText: string; source: "openai" | "fallback" }> {
  const ctx = buildCallbackAiContext(row, extra);
  const openai = getCallbackOpenAI();
  if (!openai) {
    const fb = fallbackCallbackFollowupDraft(ctx);
    return { draftText: fb.fullText, source: "fallback" };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: getCallbackOpenAIModel(),
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CALLBACK_FOLLOWUP_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            context: ctx,
            instruction: "Produis le JSON avec subject, message et cta.",
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty_completion");
    const parsed = JSON.parse(raw) as {
      subject?: unknown;
      message?: unknown;
      cta?: unknown;
    };
    const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
    const message = typeof parsed.message === "string" ? parsed.message.trim() : "";
    const cta = typeof parsed.cta === "string" ? parsed.cta.trim() : "";
    if (subject && message && cta) {
      return {
        draftText: buildDraftText(subject, message, cta),
        source: "openai",
      };
    }

    const fb = fallbackCallbackFollowupDraft(ctx);
    return { draftText: fb.fullText, source: "fallback" };
  } catch (e) {
    console.error("[generateCallbackFollowupDraft]", e);
    const fb = fallbackCallbackFollowupDraft(ctx);
    return { draftText: fb.fullText, source: "fallback" };
  }
}
