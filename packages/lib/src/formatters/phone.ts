/**
 * Normalise un numéro de téléphone français au format E.164 (+33...).
 *
 * Conforme à la règle monorepo EFFINOR : toujours normaliser les téléphones en E.164.
 *
 * @example
 *   formatPhoneE164('06 25 89 83 11')  // "+33625898311"
 *   formatPhoneE164('0625898311')       // "+33625898311"
 *   formatPhoneE164('+33625898311')     // "+33625898311"
 *   formatPhoneE164('invalid')          // null
 */
export function formatPhoneE164(
  input: string | null | undefined,
  defaultCountry: 'FR' = 'FR'
): string | null {
  if (!input) return null

  // Retire tout sauf chiffres et +
  const cleaned = input.replace(/[^\d+]/g, '')

  if (!cleaned) return null

  // Déjà en E.164
  if (cleaned.startsWith('+')) {
    // Validation basique : + suivi de 8 à 15 chiffres
    if (/^\+\d{8,15}$/.test(cleaned)) return cleaned
    return null
  }

  if (defaultCountry === 'FR') {
    // 0X XX XX XX XX (10 chiffres commençant par 0)
    if (/^0\d{9}$/.test(cleaned)) {
      return `+33${cleaned.slice(1)}`
    }
    // 33X XX XX XX XX (sans le +)
    if (/^33\d{9}$/.test(cleaned)) {
      return `+${cleaned}`
    }
  }

  return null
}

/**
 * Formate un numéro E.164 pour affichage français lisible.
 *
 * @example
 *   formatPhoneDisplay('+33625898311')  // "06 25 89 83 11"
 */
export function formatPhoneDisplay(
  e164: string | null | undefined
): string {
  if (!e164 || !e164.startsWith('+33')) return e164 ?? ''
  const digits = e164.slice(3)
  if (digits.length !== 9) return e164
  const formatted = `0${digits}`.match(/.{1,2}/g)?.join(' ') ?? e164
  return formatted
}
