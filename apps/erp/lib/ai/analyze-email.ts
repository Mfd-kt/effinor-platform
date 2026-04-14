import OpenAI from "openai";

export type EmailAnalysis = {
  /** Le client a signé ou mentionne la signature du document */
  signed: boolean;
  /** L'email contient une urgence ou un besoin de réponse rapide */
  urgent: boolean;
  /** Le client demande à être rappelé ou contacté */
  callbackRequested: boolean;
  /** Le client pose des questions ou demande des précisions */
  questionsAsked: boolean;
  /** Le client exprime un refus, une objection ou une annulation */
  negative: boolean;
  /** Le client est intéressé / positif */
  positive: boolean;
  /** Sentiment global : positive, neutral, negative */
  sentiment: "positive" | "neutral" | "negative";
  /** Résumé court (1-2 phrases) du contenu de l'email */
  summary: string;
  /** Action recommandée pour le commercial */
  recommendedAction: string;
  /** Tags détectés */
  tags: string[];
};

const SYSTEM_PROMPT = `Tu es un assistant commercial IA pour Effinor, une entreprise de performance énergétique (déstratification d'air, CEE).

Tu analyses les emails REÇUS des clients/prospects dans le cadre d'un pipeline commercial CRM.

Ton rôle : extraire des signaux commerciaux exploitables pour le chargé d'affaires.

Réponds UNIQUEMENT en JSON valide, sans commentaire ni markdown. Le format attendu :

{
  "signed": boolean,
  "urgent": boolean,
  "callbackRequested": boolean,
  "questionsAsked": boolean,
  "negative": boolean,
  "positive": boolean,
  "sentiment": "positive" | "neutral" | "negative",
  "summary": "string (1-2 phrases max, en français)",
  "recommendedAction": "string (action concrète pour le commercial, en français)",
  "tags": ["string"] 
}

Règles pour les tags (liste non exhaustive, choisis les pertinents) :
- "document_signé" : le client renvoie un document signé ou mentionne avoir signé
- "urgent" : besoin de réponse rapide, deadline mentionnée
- "rappeler" : le client demande explicitement à être rappelé
- "questions" : le client pose des questions techniques ou commerciales
- "intéressé" : le client montre de l'intérêt pour le projet
- "objection" : le client émet une objection ou un doute
- "refus" : le client refuse le projet ou annule
- "négociation" : le client négocie le prix ou les conditions
- "planification" : le client veut planifier un RDV, une visite, une installation
- "pièce_jointe" : l'email mentionne ou contient un document joint
- "remerciement" : le client remercie
- "relance_nécessaire" : pas de réponse claire, il faut relancer

Sois précis et concis. Ne sur-interprète pas. Base-toi uniquement sur le contenu de l'email.`;

function getOpenAIClient(): OpenAI | null {
  const apiKey =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPEOPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function getModel(): string {
  return (
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

export async function analyzeEmail(params: {
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  fromEmail: string;
  hasAttachments: boolean;
}): Promise<EmailAnalysis | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const body = params.textBody?.trim()
    || (params.htmlBody ? stripHtml(params.htmlBody) : "");

  if (!body) return null;

  const userMessage = [
    `De : ${params.fromEmail}`,
    `Objet : ${params.subject || "(sans objet)"}`,
    params.hasAttachments ? "Pièces jointes : oui" : "",
    "",
    "Contenu :",
    body,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_completion_tokens: 1024,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned) as EmailAnalysis;

    if (typeof parsed.signed !== "boolean") parsed.signed = false;
    if (typeof parsed.urgent !== "boolean") parsed.urgent = false;
    if (typeof parsed.callbackRequested !== "boolean") parsed.callbackRequested = false;
    if (typeof parsed.questionsAsked !== "boolean") parsed.questionsAsked = false;
    if (typeof parsed.negative !== "boolean") parsed.negative = false;
    if (typeof parsed.positive !== "boolean") parsed.positive = false;
    if (!["positive", "neutral", "negative"].includes(parsed.sentiment)) {
      parsed.sentiment = "neutral";
    }
    if (typeof parsed.summary !== "string") parsed.summary = "";
    if (typeof parsed.recommendedAction !== "string") parsed.recommendedAction = "";
    if (!Array.isArray(parsed.tags)) parsed.tags = [];

    return parsed;
  } catch (err) {
    console.error("[analyzeEmail] OpenAI error:", err);
    return null;
  }
}
