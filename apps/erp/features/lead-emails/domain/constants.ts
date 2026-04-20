/** Formulations interdites (mandat / transmission directe implicite). */
export const FORBIDDEN_PROSPECT_EMAIL_PHRASES: readonly string[] = [
  "totalenergies nous a confié",
  "total energies nous a confié",
  "votre dossier a été transmis par total",
  "dossier a été transmis par total",
  "nous sommes mandatés directement",
  "mandatés directement pour votre dossier",
  "mandat direct pour votre dossier",
];

export const CREDIBLE_CEE_FRAMING_HINTS: readonly string[] = [
  "dans le cadre des dispositifs d’efficacité énergétique soutenus par TotalEnergies",
  "dans le cadre des programmes CEE auxquels participe TotalEnergies",
];

export const MAX_EMAIL_BODY_CHARS = 3500;
export const MAX_EMAIL_SUBJECT_CHARS = 200;
export const MIN_BODY_LINES = 6;
export const MAX_BODY_LINES = 12;

/** Score minimal de personnalisation (tokens du contexte retrouvés dans le corps). */
export const MIN_PERSONALIZATION_SCORE = 2;
