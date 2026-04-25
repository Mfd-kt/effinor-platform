/**
 * Valide un email de manière simple (sans lib externe).
 * Pour des cas avancés (disposable emails, MX check), préférer Zod + une lib dédiée.
 *
 * @example
 *   isValidEmail('test@example.com')  // true
 *   isValidEmail('invalid')            // false
 *   isValidEmail('')                   // false
 */
export function isValidEmail(input: string | null | undefined): boolean {
  if (!input) return false
  // Regex RFC 5322 simplifiée (suffisante pour 99.9% des cas)
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return regex.test(input.trim())
}
