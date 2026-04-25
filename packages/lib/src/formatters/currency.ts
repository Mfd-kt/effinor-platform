/**
 * Formate un montant en euros avec séparateur milliers et décimales.
 *
 * @example
 *   formatEuro(4700)              // "4 700 €"
 *   formatEuro(1234.56)           // "1 234,56 €"
 *   formatEuro(7400, { decimals: 0 }) // "7 400 €"
 *   formatEuro(null)              // "—"
 */
export function formatEuro(
  amount: number | null | undefined,
  options: {
    locale?: string
    decimals?: number
    emptyValue?: string
  } = {}
): string {
  const {
    locale = 'fr-FR',
    decimals,
    emptyValue = '—',
  } = options

  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return emptyValue
  }

  const auto = Number.isInteger(amount) ? 0 : 2
  const effectiveDecimals = decimals ?? auto

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
  }).format(amount)
}
