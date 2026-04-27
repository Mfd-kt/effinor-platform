import { createSupabaseServerClient, warnIfUnexpectedSupabaseError } from '@/lib/supabase-server'

export type ReEnergieCategory = {
  id: string
  slug: string
  title: string
  sort_order: number
  icon_key: string | null
}

export type ReEnergieHubArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  sort_order: number
  icon_key: string | null
  external_href: string | null
}

export type ReEnergieCategoryWithArticles = ReEnergieCategory & {
  articles: ReEnergieHubArticle[]
}

export type ReEnergieArticle = {
  id: string
  category_id: string
  slug: string
  title: string
  excerpt: string
  content_html: string
  status: 'draft' | 'published' | 'archived'
  sort_order: number
  icon_key: string | null
  external_href: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  published_at: string | null
  reading_time_min: number | null
  seo_title: string | null
  seo_description: string | null
  category: ReEnergieCategory
}

const ARTICLE_FULL =
  'id,category_id,slug,title,excerpt,content_html,sort_order,icon_key,external_href,' +
  'cover_image_url,cover_image_alt,published_at,reading_time_min,seo_title,seo_description,status,' +
  'category:re_energie_categories!inner(id,slug,title,sort_order,icon_key)'

/**
 * Catégories + fiches publiées pour le hub /services (grille 3 colonnes type effy).
 */
export async function getReEnergieHubData(): Promise<ReEnergieCategoryWithArticles[]> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return []

  const { data: categories, error: cErr } = await supabase
    .from('re_energie_categories')
    .select('id,slug,title,sort_order,icon_key')
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  if (cErr) {
    warnIfUnexpectedSupabaseError('getReEnergieHubData categories', cErr)
    return []
  }

  const { data: articles, error: aErr } = await supabase
    .from('re_energie_articles')
    .select(
      'id,slug,title,excerpt,sort_order,icon_key,external_href,category_id,status,published_at'
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })
    .order('id', { ascending: true })

  if (aErr) {
    warnIfUnexpectedSupabaseError('getReEnergieHubData articles', aErr)
    return (categories ?? []).map((c) => ({
      ...(c as ReEnergieCategory),
      articles: [],
    }))
  }

  const byCat = new Map<string, ReEnergieHubArticle[]>()
  for (const row of articles ?? []) {
    const a = row as ReEnergieHubArticle & { category_id: string }
    if (!byCat.has(a.category_id)) byCat.set(a.category_id, [])
    const list = byCat.get(a.category_id)!
    if (list.some((x) => x.slug === a.slug)) continue
    list.push({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      sort_order: a.sort_order,
      icon_key: a.icon_key,
      external_href: a.external_href,
    })
  }

  return (categories ?? []).map((c) => {
    const cat = c as ReEnergieCategory
    return {
      ...cat,
      articles: byCat.get(cat.id) ?? [],
    }
  })
}

/**
 * Fiche par slugs (catégorie + article).
 */
export async function getReEnergieArticle(
  categorySlug: string,
  articleSlug: string
): Promise<ReEnergieArticle | null> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return null

  const { data: cat, error: cErr } = await supabase
    .from('re_energie_categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (cErr) {
    warnIfUnexpectedSupabaseError('getReEnergieArticle category', cErr)
    return null
  }
  if (!cat) return null

  const { data, error } = await supabase
    .from('re_energie_articles')
    .select(ARTICLE_FULL)
    .eq('category_id', cat.id)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    warnIfUnexpectedSupabaseError('getReEnergieArticle', error)
    return null
  }
  if (!data) return null

  const row = data as unknown as ReEnergieArticle & { category: ReEnergieCategory }
  if (row.category?.slug !== categorySlug) return null
  return row
}

/**
 * Combinaisons publiées hébergées sur le site (pas de `external_href` seul = pas de page dédiée ici).
 */
export async function getReEnergieStaticPaths(): Promise<
  { categorySlug: string; articleSlug: string }[]
> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return []

  const { data: rows, error } = await supabase
    .from('re_energie_articles')
    .select('slug, category:re_energie_categories!inner(slug)')
    .eq('status', 'published')
    .is('external_href', null)
    .not('published_at', 'is', null)

  if (error) {
    warnIfUnexpectedSupabaseError('getReEnergieStaticPaths', error)
    return []
  }

  return (rows ?? [])
    .map((r) => {
      const row = r as {
        slug: string
        category: { slug: string } | { slug: string }[] | null
      }
      const c = row.category
      const categorySlug = Array.isArray(c) ? c[0]?.slug : c?.slug
      if (!categorySlug) return null
      return { categorySlug, articleSlug: row.slug }
    })
    .filter(
      (p): p is { categorySlug: string; articleSlug: string } => p != null
    )
}
