/**
 * Formate une date en locale FR.
 *
 * @example
 *   formatDate(new Date('2026-04-25'))                  // "25 avril 2026"
 *   formatDate('2026-04-25', { style: 'short' })        // "25/04/2026"
 *   formatDate(Date.now(), { style: 'datetime' })       // "25 avril 2026 à 14:30"
 *   formatDate(null)                                     // "—"
 */
export function formatDate(
  input: Date | string | number | null | undefined,
  options: {
    locale?: string
    style?: 'short' | 'long' | 'datetime' | 'relative'
    emptyValue?: string
  } = {}
): string {
  const { locale = 'fr-FR', style = 'long', emptyValue = '—' } = options

  if (input === null || input === undefined) return emptyValue

  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return emptyValue

  if (style === 'short') {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  if (style === 'datetime') {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (style === 'relative') {
    return formatRelative(date, locale)
  }

  // long (défaut)
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatRelative(date: Date, locale: string): string {
  const diffMs = date.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second')
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  return rtf.format(diffDay, 'day')
}
