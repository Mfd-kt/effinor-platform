import { createClient } from "@/lib/supabase/server"

export interface TestimonialRow {
  id: string
  author_name: string
  author_city: string
  author_initials: string
  rating: number
  text: string
  service_type: string
  date_label: string
  featured: boolean
  status: "draft" | "published" | "archived"
  published_at: string | null
  created_at: string
  updated_at: string
}

export type TestimonialDetail = TestimonialRow

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id,author_name,author_city,author_initials,rating,text,service_type,date_label,featured,status,published_at,created_at,updated_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getTestimonials]", error)
    return []
  }

  return (data ?? []) as TestimonialRow[]
}

export async function getTestimonialById(
  id: string
): Promise<TestimonialDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id,author_name,author_city,author_initials,rating,text,service_type,date_label,featured,status,published_at,created_at,updated_at"
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("[getTestimonialById]", id, error)
    return null
  }

  return data as TestimonialDetail | null
}
