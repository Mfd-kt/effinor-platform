"use server"

import { revalidatePath } from "next/cache"

import { getAccessContext } from "@/lib/auth/access-context"
import { isMarketingStaff } from "@/lib/auth/role-codes"
import { createClient } from "@/lib/supabase/server"

import {
  blogArticleSchema,
  blogArticleUpdateSchema,
  type BlogArticleInput,
} from "../schemas/blog-article.schema"
import { isBlogSlugTaken } from "../queries/get-blog-articles"

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Estime le temps de lecture en minutes (200 mots/minute). Min 1. */
function calcReadingTime(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// ─── CREATE ─────────────────────────────────────────────────────────────────

export async function createBlogArticleAction(
  input: BlogArticleInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = blogArticleSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  const data = parsed.data

  if (await isBlogSlugTaken(data.slug)) {
    return { ok: false, error: "Ce slug est déjà utilisé" }
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("blog_articles")
    .insert({
      ...data,
      author_id: ctx.userId,
      reading_time_min: data.content_html
        ? calcReadingTime(data.content_html)
        : null,
      // INSERT ne déclenchait pas le trigger published_at (avant migration 20260526280100).
      ...(data.status === "published" ? { published_at: new Date().toISOString() } : {}),
    })
    .select("id")
    .single()

  if (error || !row) {
    console.error("[createBlogArticleAction]", error)
    return { ok: false, error: "Erreur lors de la création" }
  }

  revalidatePath("/marketing/blog")
  return { ok: true, id: row.id }
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────

export async function updateBlogArticleAction(
  id: string,
  input: Partial<BlogArticleInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = blogArticleUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  const data = parsed.data

  if (data.slug && (await isBlogSlugTaken(data.slug, id))) {
    return { ok: false, error: "Ce slug est déjà utilisé" }
  }

  const payload: Record<string, unknown> = { ...data }
  if (typeof data.content_html === "string") {
    payload.reading_time_min = data.content_html
      ? calcReadingTime(data.content_html)
      : null
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("blog_articles")
    .update(payload)
    .eq("id", id)

  if (error) {
    console.error("[updateBlogArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de la mise à jour" }
  }

  revalidatePath("/marketing/blog")
  revalidatePath(`/marketing/blog/${id}`)
  return { ok: true }
}

// ─── PUBLISH ────────────────────────────────────────────────────────────────

export async function publishBlogArticleAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("blog_articles")
    .update({ status: "published" })
    .eq("id", id)

  if (error) {
    console.error("[publishBlogArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de la publication" }
  }

  revalidatePath("/marketing/blog")
  revalidatePath(`/marketing/blog/${id}`)
  return { ok: true }
}

// ─── ARCHIVE ────────────────────────────────────────────────────────────────

export async function archiveBlogArticleAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("blog_articles")
    .update({ status: "archived" })
    .eq("id", id)

  if (error) {
    console.error("[archiveBlogArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de l'archivage" }
  }

  revalidatePath("/marketing/blog")
  return { ok: true }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function deleteBlogArticleAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("blog_articles")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[deleteBlogArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de la suppression" }
  }

  revalidatePath("/marketing/blog")
  return { ok: true }
}
