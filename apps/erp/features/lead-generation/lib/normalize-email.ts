const SIMPLE_EMAIL =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email normalisé : trim + lowercase. `null` si vide ou format manifestement invalide.
 */
export function normalizeEmail(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  const t = input.trim().toLowerCase();
  if (!t) {
    return null;
  }
  if (!SIMPLE_EMAIL.test(t)) {
    return null;
  }
  return t;
}
