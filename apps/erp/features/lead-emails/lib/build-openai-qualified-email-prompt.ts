import type { QualifiedLeadEmailContext } from "../domain/types";

/**
 * Prompt système — règles strictes (aucune invention, pas de marketing, CEE crédible).
 */
export const QUALIFIED_PROSPECT_EMAIL_SYSTEM_PROMPT = [
  "Tu rédiges un e-mail de prise de contact B2B court pour un conseiller en rénovation énergétique (Effinor, dispositifs CEE).",
  "Tu reçois un objet JSON `lead_context` : il contient UNIQUEMENT des informations réelles déjà connues sur le prospect.",
  "Règles absolues :",
  "- N’invente AUCUNE information (pas de chiffre, pas de nom, pas de détail bâtiment ou contact qui ne figure pas dans lead_context).",
  "- Si une information manque, ne la mentionne pas. Ne dis jamais « nous avons vu que » sans donnée fournie.",
  "- Ne fais pas un e-mail générique : utilise au moins une donnée concrète du contexte (entreprise, ville, activité, signal bâtiment, rôle, etc.) dans l’accroche ou le corps.",
  "- Si le contexte est très pauvre : message très court mais honnête, sans remplissage.",
  "- Ne mentionne pas de décideur par nom si `contact_full_name` est absent ou vide.",
  "- Ne mentionne pas le chauffage, un atelier, ou un volume si ces éléments ne sont pas indiqués dans lead_context (building_signals ou activity).",
  "- Interdit formuler ou suggérer : mandat direct, dossier transmis par TotalEnergies, « TotalEnergies nous a confié votre dossier », ou toute formulation équivalente.",
  "- Pour le cadre CEE / TotalEnergies, utilise uniquement des formulations du type : « dans le cadre des dispositifs d’efficacité énergétique soutenus par TotalEnergies » ou « dans le cadre des programmes CEE auxquels participe TotalEnergies ».",
  "- Style : professionnel, direct, humain, phrases courtes. Pas de jargon administratif. Pas de ton publicitaire. Pas de fausse urgence. Pas de superlatifs.",
  "- Longueur du corps : 6 à 10 lignes courtes maximum (hors signature implicite — le corps que tu produis est uniquement le message, sans signature).",
  "- Termine par UNE question simple pour inviter une réponse (éligibilité, échange court, précision sur le site ou le chauffage si pertinent selon les données).",
  "",
  "Tu réponds en JSON STRICT avec les clés :",
  '`"subject"` (string, une ligne, sobre),',
  '`"email_body"` (string, texte brut avec sauts de ligne \\n),',
  '`"used_signals"` (array de strings : quels champs ou faits du contexte tu as réellement utilisés, en français court),',
  '`"confidence"` : "high" | "medium" | "low" selon la richesse du contexte et la qualité de la personnalisation.',
  "",
  "Ne renvoie aucun autre champ. Ne mets pas de Markdown dans email_body.",
].join("\n");

export function buildQualifiedProspectEmailUserPrompt(context: QualifiedLeadEmailContext): string {
  return [
    "Voici le contexte `lead_context` (JSON). Rédige l’e-mail selon le système.",
    "",
    "```json",
    JSON.stringify(
      {
        lead_context: context,
        instruction:
          "Si `email` est null, tu ne peux pas simuler une adresse ; ici l’envoi est géré côté serveur — rédige quand même le message pour un destinataire générique « Bonjour » sans nom propre si aucun nom de contact.",
      },
      null,
      2,
    ),
    "```",
  ].join("\n");
}
