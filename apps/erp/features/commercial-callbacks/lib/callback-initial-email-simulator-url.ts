const DEFAULT_BASE = "https://destratificateurs.groupe-effinor.fr/";

/**
 * URL du simulateur pour l’e-mail « premier contact » rappel commercial.
 * Ajoute systématiquement `?source=callback_email` (fusion avec les paramètres existants).
 */
export function resolveCallbackInitialEmailSimulatorUrl(): string {
  const raw =
    process.env.CALLBACK_INITIAL_EMAIL_SIMULATOR_URL?.trim() || DEFAULT_BASE;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    u.searchParams.set("source", "callback_email");
    return u.toString();
  } catch {
    const u = new URL(DEFAULT_BASE);
    u.searchParams.set("source", "callback_email");
    return u.toString();
  }
}
