/** Types d’activité enregistrables (CHECK SQL + validation Zod). */
export const LEAD_GENERATION_ACTIVITY_TYPES = [
  "call",
  "email",
  "note",
  "status_update",
  "follow_up",
] as const;

export type LeadGenerationActivityType = (typeof LEAD_GENERATION_ACTIVITY_TYPES)[number];

/** Résultats / issues métier pour le suivi commercial (validation applicative). */
export const LEAD_GENERATION_ACTIVITY_OUTCOMES = [
  "called_no_answer",
  "called_wrong_number",
  "called_standard",
  "called_interested",
  "called_not_interested",
  "called_callback_requested",
  "email_sent",
  "email_bounced",
  "qualified_for_conversion",
  "out_of_target_after_review",
] as const;

export type LeadGenerationActivityOutcome = (typeof LEAD_GENERATION_ACTIVITY_OUTCOMES)[number];

export const LEAD_GENERATION_ACTIVITY_TYPE_LABELS: Record<LeadGenerationActivityType, string> = {
  call: "Appel",
  email: "E-mail",
  note: "Note",
  status_update: "Mise à jour de statut",
  follow_up: "Relance / suivi",
};

export const LEAD_GENERATION_ACTIVITY_OUTCOME_LABELS: Record<LeadGenerationActivityOutcome, string> = {
  called_no_answer: "Pas de réponse",
  called_wrong_number: "Numéro incorrect",
  called_standard: "Échange standard",
  called_interested: "Intéressé",
  called_not_interested: "Pas intéressé",
  called_callback_requested: "Rappel demandé",
  email_sent: "Email envoyé",
  email_bounced: "Email en erreur",
  qualified_for_conversion: "Qualifié pour conversion",
  out_of_target_after_review: "Hors cible après analyse",
};
