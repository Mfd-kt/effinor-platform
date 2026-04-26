import { cache } from 'react'

import { defaultHomeTestimonials, type Testimonial } from './testimonials-data'
import { createSupabaseServerClient, warnIfUnexpectedSupabaseError } from './supabase-server'

type TestimonialRow = {
  id: string
  author_name: string
  author_city: string
  author_initials: string
  rating: number
  text: string
  service_type: string
  date_label: string
}

/**
 * Témoignages publiés (home). Fallback sur les placeholders si DB vide / indisponible.
 */
export const getPublishedTestimonials = cache(
  async (): Promise<{ items: Testimonial[]; isFallback: boolean }> => {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { items: [...defaultHomeTestimonials], isFallback: true }
    }

    const { data, error } = await supabase
      .from('testimonials')
      .select(
        'id, author_name, author_city, author_initials, rating, text, service_type, date_label, featured, published_at'
      )
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })

    if (error) {
      warnIfUnexpectedSupabaseError('getPublishedTestimonials', error)
      return { items: [...defaultHomeTestimonials], isFallback: true }
    }

    const rows = (data ?? []) as TestimonialRow[]
    if (rows.length === 0) {
      return { items: [...defaultHomeTestimonials], isFallback: true }
    }

    return {
      isFallback: false,
      items: rows.map((r) => ({
        id: r.id,
        authorName: r.author_name,
        authorCity: r.author_city,
        authorInitials: r.author_initials,
        rating: r.rating,
        text: r.text,
        service: r.service_type,
        date: r.date_label,
      })),
    }
  }
)
