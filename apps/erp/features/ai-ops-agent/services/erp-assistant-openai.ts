import OpenAI from "openai";

const ERP_ASSISTANT_SYSTEM = `Tu es l'assistant Effinor ERP pour les équipes internes (commercial, technique, pilotage CEE).
Tu réponds en français, de façon claire et concise.

Tu peux aider sur :
- la navigation et l'utilisation de l'application (menus, listes, filtres, fiches) ;
- les grands principes des workflows CEE (agent, closer, visites techniques, leads) ;
- les bonnes pratiques générales et la terminologie métier.

Règles :
- Ne fabrique pas de données sur des dossiers, clients ou montants précis que tu ne vois pas dans la conversation.
- Si une information manque, dis-le et propose quoi vérifier dans l'interface ou auprès d'un collègue.
- Ne donne pas de conseils juridiques ou fiscaux définitifs ; renvoie vers la conformité / la direction si besoin.
- Pas de HTML sauf si l'utilisateur le demande explicitement ; du texte brut ou markdown léger va bien.`;

export function getErpAssistantOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function getErpAssistantModel(): string {
  return (
    process.env.OPENAI_ERP_ASSISTANT_MODEL?.trim() ||
    process.env.OPENAI_CHAT_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

export function getErpAssistantSystemPrompt(): string {
  return ERP_ASSISTANT_SYSTEM;
}

export function buildFallbackUserHelpReply(userQuestionPreview: string): string {
  const p = userQuestionPreview.trim().slice(0, 280);
  return [
    "Le service d’assistant IA n’est pas disponible (clé OpenAI absente ou erreur côté serveur).",
    "Tu peux en attendant utiliser la page « Agent opérations » en plein écran, le digest, ou demander à un administrateur.",
    p ? `Ta question commençait par : « ${p}${userQuestionPreview.length > 280 ? "…" : ""} »` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
