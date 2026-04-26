import { createSupabaseServerClient, warnIfUnexpectedSupabaseError } from '@/lib/supabase-server'

export const SERVICE_TYPES = [
  'pac-maison',
  'pac-immeuble',
  'ssc',
  'renovation-globale',
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  'pac-maison': 'Pompe à chaleur — Maison',
  'pac-immeuble': 'Pompe à chaleur — Immeuble',
  ssc: 'Système solaire combiné',
  'renovation-globale': 'Rénovation globale',
}

export interface RealisationCard {
  id: string
  slug: string
  title: string
  excerpt: string
  city: string
  region: string | null
  service_type: string
  surface_m2: number | null
  year_completed: number | null
  total_cost_eur: number | null
  total_aids_eur: number | null
  cover_image_url: string | null
  cover_image_alt: string | null
  featured: boolean
  published_at: string
}

export interface RealisationFull extends RealisationCard {
  description_html: string
  gallery_urls: string[]
  postal_code: string | null
}

const CARD_COLUMNS =
  'id,slug,title,excerpt,city,region,service_type,' +
  'surface_m2,year_completed,total_cost_eur,total_aids_eur,' +
  'cover_image_url,cover_image_alt,featured,published_at'

const FULL_COLUMNS = `${CARD_COLUMNS},description_html,gallery_urls,postal_code`

/**
 * Liste des réalisations publiées (page /realisations).
 */
export async function getPublishedRealisations(params?: {
  service_type?: string
  limit?: number
}): Promise<RealisationCard[]> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return []

  let query = supabase
    .from('realisations')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false })

  if (params?.service_type) {
    query = query.eq('service_type', params.service_type)
  }
  if (params?.limit) {
    query = query.limit(params.limit)
  }

  const { data, error } = await query

  if (error) {
    warnIfUnexpectedSupabaseError('getPublishedRealisations', error)
    return []
  }

  return (data ?? []) as unknown as RealisationCard[]
}

/**
 * Détail complet d'une réalisation par slug (page /realisations/[slug]).
 */
export async function getRealisationBySlug(
  slug: string
): Promise<RealisationFull | null> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('realisations')
    .select(FULL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    warnIfUnexpectedSupabaseError(`getRealisationBySlug (${slug})`, error)
    return null
  }

  return data as unknown as RealisationFull | null
}

/**
 * Tous les slugs publiés (pour generateStaticParams).
 * Retourne [] si le client Supabase n'est pas disponible (env vars manquantes
 * au build). Next.js rendra alors les pages à la demande au runtime.
 */
export async function getAllRealisationSlugs(): Promise<string[]> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('realisations')
    .select('slug')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())

  if (error) {
    warnIfUnexpectedSupabaseError('getAllRealisationSlugs', error)
    return []
  }

  return (data ?? []).map((r: { slug: string }) => r.slug)
}
