/**
 * Téléphone canonique pour comparaison : uniquement des chiffres, logique FR simple.
 * Retourne `null` si vide ou trop court pour être exploitable.
 */

const MIN_DIGITS = 8;

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/** Retire les préfixes courants (Tel., Fax…) pour l’affichage brut, sans altérer les chiffres. */
export function stripPhoneDisplayNoise(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const stripped = trimmed
    .replace(/^(tel\.?|tél\.?|téléphone|telephone|mobile|portable|fax)\s*[.:]?\s*/i, "")
    .trim();
  return stripped || null;
}

/**
 * Normalise un numéro pour dédup / stock `normalized_phone`.
 * - Supprime espaces, tirets, parenthèses, etc.
 * - `+33` / `0033` → préfixe national `0…` (10 chiffres) quand pertinent.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let d = onlyDigits(trimmed);

  if (d.startsWith("33") && d.length === 11) {
    d = `0${d.slice(2)}`;
  } else if (d.startsWith("0033") && d.length === 13) {
    d = `0${d.slice(4)}`;
  }

  if (d.length < MIN_DIGITS) {
    return null;
  }

  return d;
}
