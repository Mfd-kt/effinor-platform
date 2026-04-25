/**
 * Normalise un numéro français vers E.164 (+33…).
 * Inspiré de `normalizePhone` lead-generation, avec sortie internationale.
 */

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/** Attendu après retrait du 0 initial : 9 chiffres (mobile / fixe). */
const NATIONAL_LEN = 9;

/**
 * @returns `+33XXXXXXXXX` ou `null` si invalide / vide.
 */
export function normalizeFrPhoneToE164(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let d = onlyDigits(trimmed);

  if (d.startsWith("33") && d.length >= 11) {
    d = d.slice(2);
  } else if (d.startsWith("0033") && d.length >= 13) {
    d = d.slice(4);
  } else if (d.startsWith("0") && d.length >= 10) {
    d = d.slice(1);
  }

  if (d.length !== NATIONAL_LEN) {
    return null;
  }

  return `+33${d}`;
}
