import { createClient } from "@/lib/supabase/server"

export interface ReEnergieCategoryRow {
  id: string
  slug: string
  title: string
  sort_order: number
  icon_key: string | null
  created_at: string
  updated_at: string
}

export interface ReEnergieArticleRow {
  id: string
  category_id: string
  title: string
  slug: string
  excerpt: string
  status: "draft" | "published" | "archived"
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
  reading_time_min: number | null
  cover_image_url: string | null
  author_id: string | null
  icon_key: string | null
  external_href: string | null
  category: { slug: string; title: string } | null
}

export interface ReEnergieArticleDetail {
  id: string
  category_id: string
  title: string
  slug: string
  excerpt: string
  content_html: string
  content_json: Record<string, unknown> | null
  status: "draft" | "published" | "archived"
  sort_order: number
  published_at: string | null
  created_at: string
  updated_at: string
  reading_time_min: number | null
  cover_image_url: string | null
  cover_image_alt: string | null
  seo_title: string | null
  seo_description: string | null
  author_id: string | null
  icon_key: string | null
  external_href: string | null
  view_count: number
  category: { id: string; slug: string; title: string; sort_order: number; icon_key: string | null }
}

export async function getReEnergieCategories(): Promise<ReEnergieCategoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("re_energie_categories")
    .select("id,slug,title,sort_order,icon_key,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })

  if (error) {
    console.error("[getReEnergieCategories]", error)
    return []
  }
  return (data ?? []) as ReEnergieCategoryRow[]
}

export async function getReEnergieArticles(): Promise<ReEnergieArticleRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("re_energie_articles")
    .select(
      "id,category_id,title,slug,excerpt,status,sort_order," +
        "published_at,created_at,updated_at,reading_time_min," +
        "cover_image_url,author_id,icon_key,external_href," +
        "category:re_energie_categories!inner(slug,title)"
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getReEnergieArticles]", error)
    return []
  }
  return (data ?? []) as unknown as ReEnergieArticleRow[]
}

export async function getReEnergieArticleById(
  id: string
): Promise<ReEnergieArticleDetail | null> {
  const supabase = await createClient()
  const { data: row, error: e1 } = await supabase
    .from("re_energie_articles")
    .select("*")
    .eq("id", id)
    .single()

  if (e1 || !row) {
    console.error("[getReEnergieArticleById]", id, e1)
    return null
  }

  const r = row as { category_id: string }
  const { data: cat, error: e2 } = await supabase
    .from("re_energie_categories")
    .select("id,slug,title,sort_order,icon_key")
    .eq("id", r.category_id)
    .single()

  if (e2 || !cat) {
    console.error("[getReEnergieArticleById] category", e2)
    return null
  }

  return { ...row, category: cat } as ReEnergieArticleDetail
}

export async function isReEnergieArticleSlugTaken(
  categoryId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = await createClient()
  let query = supabase
    .from("re_energie_articles")
    .select("id")
    .eq("category_id", categoryId)
    .eq("slug", slug)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query.limit(1)
  return (data?.length ?? 0) > 0
}
