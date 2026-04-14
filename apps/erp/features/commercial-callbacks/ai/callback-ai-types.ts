/** Ton recommandé pour l’appel (hors jargon interne). */
export type CallbackAiTone = "direct" | "rassurant" | "relance_legere";

/** Contexte structuré pour prompts / affichage agent. */
export type CallbackAiContext = {
  companyName: string;
  contactName: string;
  phone: string;
  email: string | null;
  callbackReason: string | null;
  callbackComment: string;
  /** Aligné sur `call_context_summary` en base (résumé / accroche). */
  contextSummary: string | null;
  preferredPeriod: string | null;
  prospectTemperature: string | null;
  estimatedValueEur: number | null;
  attemptsCount: number;
  lastCallAt: string | null;
  callbackDate: string;
  callbackTime: string | null;
  nextReminderAt: string | null;
  source: string | null;
  /** Libellé lisible pour l’agent (pas de code technique seul). */
  statusLabel: string;
  whyNow: string;
  agentGoal: string;
  recommendedTone: CallbackAiTone;
  /** Fiche CEE ou contexte projet si fourni. */
  ceeSheetHint: string | null;
};

export type CallbackAiExtra = {
  ceeSheetLabel?: string | null;
  ceeSheetCode?: string | null;
};

/** Réponse structurée script (sert aussi au parsing OpenAI). */
export type CallbackCallScriptParts = {
  opening: string;
  contextReminder: string;
  openingQuestion: string;
  nextStep: string;
  /** 3 à 6 lignes prêtes à lire. */
  lines: string[];
};

export type CallbackFollowupDraftParts = {
  subject: string;
  message: string;
  cta: string;
  /** Texte copiable (objet + corps + CTA). */
  fullText: string;
};
