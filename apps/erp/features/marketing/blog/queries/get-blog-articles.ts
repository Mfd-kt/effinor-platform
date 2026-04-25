import { createClient } from "@/lib/supabase/server"

export interface BlogArticleRow {
  id: string
  title: string
  slug: string
  excerpt: string
  status: "draft" | "published" | "archived"
  featured: boolean
  category: string | null
  tags: string[]
  published_at: string | null
  created_at: string
  updated_at: string
  reading_time_min: number | null
  view_count: number
  cover_image_url: string | null
  author_id: string | null
}

export interface BlogArticleDetail extends BlogArticleRow {
  content_html: string
  content_json: Record<string, unknown> | null
  seo_title: string | null
  seo_description: string | null
  cover_image_alt: string | null
}

/**
 * Liste paginée des articles de blog (tous statuts pour le staff).
 * RLS gère l'accès — anon ne voit que les published.
 */
export async function getBlogArticles(params?: {
  status?: "draft" | "published" | "archived"
  limit?: number
  offset?: number
}): Promise<BlogArticleRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from("blog_articles")
    .select(
      "id,title,slug,excerpt,status,featured,category,tags," +
        "published_at,created_at,updated_at,reading_time_min," +
        "view_count,cover_image_url,author_id"
    )
    .order("created_at", { ascending: false })

  if (params?.status) {
    query = query.eq("status", params.status)
  }

  if (params?.limit) {
    query = query.limit(params.limit)
  }

  if (params?.offset !== undefined) {
    query = query.range(
      params.offset,
      params.offset + (params.limit ?? 20) - 1
    )
  }

  const { data, error } = await query

  if (error) {
    console.error("[getBlogArticles]", error)
    return []
  }

  return (data ?? []) as unknown as BlogArticleRow[]
}

/**
 * Détail complet d'un article (avec content_html et content_json).
 */
export async function getBlogArticleById(
  id: string
): Promise<BlogArticleDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[getBlogArticleById]", id, error)
    return null
  }

  return data as unknown as BlogArticleDetail
}

/**
 * Vérifie si un slug est déjà utilisé.
 * @param excludeId à exclure (pour la mise à jour : on ignore l'article courant)
 */
export async function isBlogSlugTaken(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase.from("blog_articles").select("id").eq("slug", slug)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query.limit(1)
  return (data?.length ?? 0) > 0
}
