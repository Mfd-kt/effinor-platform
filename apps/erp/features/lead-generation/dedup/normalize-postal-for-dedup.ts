/** Code postal FR : 5 chiffres, espaces retirés. */
export function normalizePostalCodeForDedup(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 4) {
    return null;
  }
  return digits.slice(0, 5);
}
