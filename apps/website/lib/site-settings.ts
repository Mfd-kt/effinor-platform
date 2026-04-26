import { cache } from 'react'

import { siteConfig } from './site-config.defaults'
import { siteStats as defaultSiteStats, type SiteStat } from './site-stats'
import { createSupabaseServerClient } from './supabase-server'

/** Contact fusionné (API publique) — types élargis (pas de littéraux en lecture seule). */
export type SiteContact = {
  email: string
  phone: string
  phoneE164: string
  address: {
    street: string
    postalCode: string
    city: string
    country: string
    full: string
  }
  hours: {
    label: string
    schema: { days: string; opens: string; closes: string }[]
  }
}

function mergeContact(base: SiteContact, patch: unknown): SiteContact {
  if (!patch || typeof patch !== 'object') return base
  const p = patch as Record<string, unknown>
  const addrIn = p.address
  const hoursIn = p.hours

  const merged: SiteContact = {
    ...base,
    ...(typeof p.email === 'string' ? { email: p.email } : {}),
    ...(typeof p.phone === 'string' ? { phone: p.phone } : {}),
    ...(typeof p.phoneE164 === 'string' ? { phoneE164: p.phoneE164 } : {}),
    address:
      addrIn && typeof addrIn === 'object'
        ? { ...base.address, ...(addrIn as Record<string, string>) }
        : { ...base.address },
    hours:
      hoursIn && typeof hoursIn === 'object' && hoursIn !== null && 'label' in hoursIn
        ? (() => {
            const h = hoursIn as { label?: string; schema?: unknown }
            return {
              label: String(h.label ?? base.hours.label),
              schema: Array.isArray(h.schema)
                ? (h.schema as SiteContact['hours']['schema'])
                : base.hours.schema.map((s) => ({ ...s })),
            }
          })()
        : {
            label: base.hours.label,
            schema: base.hours.schema.map((s) => ({ ...s })),
          },
  }
  return merged
}

/**
 * Coordonnées de contact (fusion DB → défauts).
 */
export const getSiteContact = cache(async (): Promise<SiteContact> => {
  const base = siteConfig.contact as unknown as SiteContact
  const supabase = createSupabaseServerClient()
  if (!supabase) return base

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'contact')
    .maybeSingle()

  if (error) {
    console.error('[getSiteContact]', error)
    return base
  }
  if (!data?.value) return base
  return mergeContact(base, data.value)
})

/**
 * Statistiques du bandeau de confiance (4 entrées, ordre figé côté site).
 */
export const getSiteStats = cache(async (): Promise<SiteStat[]> => {
  const base: SiteStat[] = defaultSiteStats.map((s) => ({ ...s }))
  const supabase = createSupabaseServerClient()
  if (!supabase) return base

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'stats')
    .maybeSingle()

  if (error) {
    console.error('[getSiteStats]', error)
    return base
  }
  const raw = data?.value
  if (!raw || !Array.isArray(raw)) return base

  return base.map((b, i) => {
    const item = raw[i] as
      | { value?: string; label?: string; description?: string }
      | undefined
    if (!item) return b
    return {
      value: typeof item.value === 'string' ? item.value : b.value,
      label: typeof item.label === 'string' ? item.label : b.label,
      description:
        typeof item.description === 'string' ? item.description : b.description,
    }
  })
})
