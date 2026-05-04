import { createSupabaseServerClient, warnIfUnexpectedSupabaseError } from '@/lib/supabase-server'

export interface BlogPostCard {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_image_url: string | null
  cover_image_alt: string | null
  category: string | null
  tags: string[]
  published_at: string
  reading_time_min: number | null
  featured: boolean
}

export interface BlogPostFull extends BlogPostCard {
  content_html: string
  seo_title: string | null
  seo_description: string | null
}

const CARD_COLUMNS =
  'id,slug,title,excerpt,cover_image_url,cover_image_alt,' +
  'category,tags,published_at,reading_time_min,featured'

const FULL_COLUMNS = `${CARD_COLUMNS},content_html,seo_title,seo_description`

/**
 * Liste des articles publiés pour la page /blog.
 * RLS gère la sécurité (anon ne voit que published + date passée),
 * mais on filtre aussi côté query pour être explicite et pouvoir
 * trier par featured.
 */
export async function getPublishedBlogPosts(params?: {
  category?: string
  limit?: number
}): Promise<BlogPostCard[]> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return []

  let query = supabase
    .from('blog_articles')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })

  if (params?.category) {
    query = query.eq('category', params.category)
  }

  const effectiveLimit = params?.limit ?? 200
  query = query.limit(effectiveLimit)

  const { data, error } = await query

  if (error) {
    warnIfUnexpectedSupabaseError('getPublishedBlogPosts', error)
    return []
  }

  const rows = (data ?? []) as unknown as BlogPostCard[]
  // Tri secondaire côté app : mis en avant d’abord, puis date (évite tout edge case multi-.order PostgREST).
  rows.sort((a, b) => {
    const fa = a.featured ? 1 : 0
    const fb = b.featured ? 1 : 0
    if (fb !== fa) return fb - fa
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  })
  return rows
}

/**
 * Détail complet d'un article par slug (pour /blog/[slug]).
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPostFull | null> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('blog_articles')
    .select(FULL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  if (error) {
    warnIfUnexpectedSupabaseError(`getBlogPostBySlug (${slug})`, error)
    return null
  }

  return data as unknown as BlogPostFull | null
}

/**
 * Tous les slugs publiés (pour generateStaticParams).
 * Retourne [] si le client Supabase n'est pas disponible (env vars manquantes
 * au build). Next.js rendra alors les pages à la demande au runtime.
 */
export async function getAllBlogSlugs(): Promise<string[]> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('blog_articles')
    .select('slug')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())

  if (error) {
    warnIfUnexpectedSupabaseError('getAllBlogSlugs', error)
    return []
  }

  return (data ?? []).map((r: { slug: string }) => r.slug)
}

/**
 * Articles liés (même catégorie, excluant l'article courant).
 */
export async function getRelatedPosts(
  currentSlug: string,
  category: string | null,
  limit = 3
): Promise<BlogPostCard[]> {
  const supabase = createSupabaseServerClient()
  if (!supabase) return []

  let query = supabase
    .from('blog_articles')
    .select(CARD_COLUMNS)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    warnIfUnexpectedSupabaseError('getRelatedPosts', error)
    return []
  }

  return (data ?? []) as unknown as BlogPostCard[]
}
