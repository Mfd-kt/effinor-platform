/**
 * Configuration centralisée des automatisations (env + garde-fous).
 * Pas d’UI admin requise : ajuster les variables puis redéployer.
 */

function envBool(name: string, defaultValue: boolean): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (!v) return defaultValue;
  return v === "1" || v === "true" || v === "yes";
}

function envInt(name: string, defaultValue: number): number {
  const v = process.env[name]?.trim();
  if (!v) return defaultValue;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultValue;
}

function envEuro(name: string, defaultValue: number): number {
  const v = process.env[name]?.trim();
  if (!v) return defaultValue;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : defaultValue;
}

export type AutomationConfig = {
  slackSmartEnabled: boolean;
  /** Fenêtre anti-doublon Slack (ms). */
  slackDedupeWindowMs: number;
  /** Impact € estimé minimum pour déclencher Slack sur alerte warning (hors critical). */
  slackMinImpactEuroForWarning: number;
  autoAssignConfirmateur: boolean;
  autoAssignCloser: boolean;
  /** Relance IA : brouillon uniquement (recommandé). */
  aiFollowUpDraftOnly: boolean;
  /** Relance IA : envoi auto (réservé aux cas très encadrés — désactivé par défaut). */
  aiFollowUpAutoSend: boolean;
  /** Jours accord envoyé sans signature → candidat relance IA. */
  agreementStaleDaysForFollowUp: number;
};

export function getAutomationConfig(): AutomationConfig {
  return {
    slackSmartEnabled: envBool("AUTOMATION_SLACK_SMART_ENABLED", false),
    slackDedupeWindowMs: envInt("AUTOMATION_SLACK_DEDUPE_WINDOW_MS", 4 * 60 * 60 * 1000),
    slackMinImpactEuroForWarning: envEuro("AUTOMATION_SLACK_MIN_IMPACT_EUR", 5_000),
    autoAssignConfirmateur: envBool("AUTOMATION_AUTO_ASSIGN_CONFIRMATEUR", true),
    autoAssignCloser: envBool("AUTOMATION_AUTO_ASSIGN_CLOSER", true),
    aiFollowUpDraftOnly: envBool("AUTOMATION_AI_FOLLOWUP_DRAFT_ONLY", true),
    aiFollowUpAutoSend: envBool("AUTOMATION_AI_FOLLOWUP_AUTO_SEND", false),
    agreementStaleDaysForFollowUp: envInt("AUTOMATION_AGREEMENT_STALE_DAYS_FOLLOWUP", 7),
  };
}

/** Base URL publique pour liens Slack (cohérent avec notifications). */
export function resolveAutomationPublicAppBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (explicit) {
    if (explicit.startsWith("http://") || explicit.startsWith("https://")) return explicit;
    return `https://${explicit}`;
  }
  return "http://localhost:3000";
}

export function absoluteAutomationUrl(pathOrUrl: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) return resolveAutomationPublicAppBaseUrl();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const base = resolveAutomationPublicAppBaseUrl().replace(/\/$/, "");
  const p = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${p}`;
}
