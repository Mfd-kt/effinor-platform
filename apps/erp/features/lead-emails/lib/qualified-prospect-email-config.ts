/**
 * Configuration centralisée — logos et activation d’envoi.
 * Variables : voir `.env.example` (racine monorepo).
 */

export function isQualifiedProspectEmailEnabled(): boolean {
  const v = process.env.QUALIFIED_LEAD_PROSPECT_EMAIL_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getTotalEnergiesLogoUrl(): string {
  return process.env.EMAIL_TOTALENERGIES_LOGO_URL?.trim() || "";
}

export function getEffinorLogoUrl(): string {
  return process.env.EMAIL_EFFINOR_LOGO_URL?.trim() || "";
}

export function getOpenAiQualifiedEmailModel(): string {
  return (process.env.OPENAI_QUALIFIED_LEAD_EMAIL_MODEL ?? "gpt-4.1-mini").trim() || "gpt-4.1-mini";
}
