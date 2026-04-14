import { buildCallbackAiContext } from "@/features/commercial-callbacks/ai/build-callback-ai-context";
import { CALLBACK_FOLLOWUP_SYSTEM } from "@/features/commercial-callbacks/ai/callback-ai-prompts";
import { getCallbackOpenAI, getCallbackOpenAIModel } from "@/features/commercial-callbacks/ai/callback-openai-client";
import type { CallbackAutoFollowupSuggestedType } from "@/features/commercial-callbacks/lib/callback-auto-followup-rules";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

const AUTO_SYSTEM = `${CALLBACK_FOLLOWUP_SYSTEM}

Cas : relance e-mail automatique après rappel téléphonique (Effinor, B2B, France).
- Une seule salutation, court, sans répétition.
- Pas de statut interne, pas de "workflow".
- Pas de promesse de financement ou d'aide CEE chiffrée.
- HTML simple : paragraphes <p>, pas de style inline lourd.

Réponds en JSON :
{
  "subject": "objet court",
  "htmlBody": "HTML minimal (p, br)",
  "textBody": "texte brut pour alternative"
}`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fallbackEmail(
  row: CommercialCallbackRow,
  suggestedType: CallbackAutoFollowupSuggestedType,
): { subject: string; htmlBody: string; textBody: string } {
  const ctx = buildCallbackAiContext(row);
  const prenom = row.contact_name.trim().split(/\s+/)[0] || "";
  const societe = row.company_name;
  const polite = prenom ? `Bonjour ${prenom},` : "Bonjour,";

  let subject: string;
  let core: string;

  switch (suggestedType) {
    case "no_answer_followup":
      subject = `${societe} — suite à notre tentative d’appel`;
      core = `Nous n’avons pas réussi à vous joindre au téléphone. Si le sujet est toujours d’actualité pour ${societe}, répondez avec un créneau qui vous convient, ou indiquez-nous si le dossier n’est plus prioritaire.`;
      break;
    case "scheduling_followup":
      subject = `${societe} — créneau de rappel`;
      core = `Nous revenons vers vous pour convenir d’un prochain échange. Indiquez par retour de mail un moment qui vous arrange, ou les informations utiles pour avancer.`;
      break;
    case "reminder_followup":
      subject = `${societe} — petit rappel`;
      core = `Petit point suite à nos échanges : souhaitez-vous des précisions par écrit ou un nouvel appel à une date fixe ?`;
      break;
    case "callback_confirmation":
    default:
      subject = `${societe} — suite à votre demande`;
      core = `Comme échangé, voici un court rappel de notre accompagnement sur vos projets d’optimisation énergétique. Répondez à ce message pour la suite.`;
      break;
  }

  const memo = ctx.contextSummary?.trim()
    ? `\n\nPour mémoire : ${ctx.contextSummary.trim().slice(0, 400)}`
    : "";
  const body = `${polite}\n\n${core}${memo}\n\nCordialement,\nL’équipe Effinor`;

  const textBody = body;
  const htmlBody = `<p>${escapeHtml(body).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;

  return { subject, htmlBody, textBody };
}

export type GeneratedAutoFollowupEmail = {
  subject: string;
  htmlBody: string;
  textBody: string;
  source: "openai" | "fallback";
};

/**
 * Génère l’e-mail de relance auto (OpenAI ou fallback métier).
 */
export async function generateCallbackAutoFollowupEmail(
  row: CommercialCallbackRow,
  suggestedType: CallbackAutoFollowupSuggestedType,
): Promise<GeneratedAutoFollowupEmail> {
  const openai = getCallbackOpenAI();
  if (!openai) {
    const fb = fallbackEmail(row, suggestedType);
    return { ...fb, source: "fallback" };
  }

  const ctx = buildCallbackAiContext(row);

  try {
    const completion = await openai.chat.completions.create({
      model: getCallbackOpenAIModel(),
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: AUTO_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            context: ctx,
            suggestedType,
            instruction: "Produis subject, htmlBody, textBody.",
          }) as unknown as string,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as {
      subject?: unknown;
      htmlBody?: unknown;
      textBody?: unknown;
    };
    const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
    const htmlBody = typeof parsed.htmlBody === "string" ? parsed.htmlBody.trim() : "";
    const textBody = typeof parsed.textBody === "string" ? parsed.textBody.trim() : "";
    if (subject && htmlBody && textBody) {
      return { subject, htmlBody, textBody, source: "openai" };
    }
  } catch (e) {
    console.error("[generateCallbackAutoFollowupEmail]", e);
  }

  const fb = fallbackEmail(row, suggestedType);
  return { ...fb, source: "fallback" };
}
