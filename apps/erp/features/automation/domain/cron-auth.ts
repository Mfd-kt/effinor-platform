/**
 * Secret dédié au cron HTTP d’automatisation.
 * Priorité : AUTOMATION_CRON_SECRET puis CRON_SECRET (compatibilité).
 */
export function getCronAutomationSecret(): string | null {
  const a = process.env.AUTOMATION_CRON_SECRET?.trim();
  if (a) return a;
  const b = process.env.CRON_SECRET?.trim();
  if (b) return b;
  return null;
}

/** True si l’environnement est configuré pour accepter le cron (secret défini). */
export function isCronAutomationSecretConfigured(): boolean {
  return Boolean(getCronAutomationSecret());
}
