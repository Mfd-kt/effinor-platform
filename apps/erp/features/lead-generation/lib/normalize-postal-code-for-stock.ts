import { normalizePostalCodeForDedup } from "../dedup/normalize-postal-for-dedup";

/**
 * Code postal stocké à l’ingestion : trim, espaces parasites retirés quand c’est possible.
 * Si le format n’est pas reconnaissable comme CP à chiffres, conserve une forme affichable prudente.
 */
export function normalizePostalCodeForStock(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const collapsed = trimmed.replace(/\s+/g, " ");
  const digitsKey = normalizePostalCodeForDedup(collapsed);
  if (digitsKey) {
    return digitsKey;
  }
  return collapsed.replace(/\s/g, "") || null;
}
