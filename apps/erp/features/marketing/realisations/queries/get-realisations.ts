import { createClient } from "@/lib/supabase/server"

export interface RealisationRow {
  id: string
  slug: string
  title: string
  excerpt: string
  city: string
  postal_code: string | null
  region: string | null
  service_type: string
  surface_m2: number | null
  year_completed: number | null
  total_cost_eur: number | null
  total_aids_eur: number | null
  cover_image_url: string | null
  cover_image_alt: string | null
  gallery_urls: string[]
  status: "draft" | "published" | "archived"
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface RealisationDetail extends RealisationRow {
  description_html: string
}

const ROW_COLUMNS =
  "id,slug,title,excerpt,city,postal_code,region,service_type," +
  "surface_m2,year_completed,total_cost_eur,total_aids_eur," +
  "cover_image_url,cover_image_alt,gallery_urls," +
  "status,featured,published_at,created_at,updated_at"

/**
 * Liste paginée des réalisations (tous statuts pour le staff).
 * RLS gère l'accès — anon ne voit que les published.
 */
export async function getRealisations(params?: {
  status?: "draft" | "published" | "archived"
  service_type?: string
  limit?: number
}): Promise<RealisationRow[]> {
  const supabase = await createClient()

  let query = supabase
    .from("realisations")
    .select(ROW_COLUMNS)
    .order("created_at", { ascending: false })

  if (params?.status) {
    query = query.eq("status", params.status)
  }
  if (params?.service_type) {
    query = query.eq("service_type", params.service_type)
  }
  if (params?.limit) {
    query = query.limit(params.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error("[getRealisations]", error)
    return []
  }
  return (data ?? []) as unknown as RealisationRow[]
}

/**
 * Détail complet d'une réalisation (avec description_html).
 */
export async function getRealisationById(
  id: string,
): Promise<RealisationDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("realisations")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[getRealisationById]", id, error)
    return null
  }
  return data as unknown as RealisationDetail
}

/**
 * Vérifie si un slug est déjà utilisé.
 */
export async function isRealisationSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase.from("realisations").select("id").eq("slug", slug)
  if (excludeId) {
    query = query.neq("id", excludeId)
  }
  const { data } = await query.limit(1)
  return (data?.length ?? 0) > 0
}
