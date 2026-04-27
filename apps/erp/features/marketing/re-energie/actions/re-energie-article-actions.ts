"use server"

import { revalidatePath } from "next/cache"

import { getAccessContext } from "@/lib/auth/access-context"
import { isMarketingStaff } from "@/lib/auth/role-codes"
import { createClient } from "@/lib/supabase/server"

import {
  reEnergieArticleSchema,
  reEnergieArticleUpdateSchema,
  type ReEnergieArticleInput,
} from "../schemas/re-energie-article.schema"
import { getReEnergieArticleById, isReEnergieArticleSlugTaken } from "../queries/get-re-energie"

function calcReadingTime(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function normalizeHref(v: string | null | undefined): string | null {
  if (v == null || v === "") return null
  return v
}

export async function createReEnergieArticleAction(
  input: ReEnergieArticleInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = reEnergieArticleSchema.safeParse({
    ...input,
    external_href: normalizeHref(input.external_href as string | null | undefined),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  const data = parsed.data

  if (await isReEnergieArticleSlugTaken(data.category_id, data.slug)) {
    return { ok: false, error: "Ce slug est déjà utilisé dans cette catégorie" }
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("re_energie_articles")
    .insert({
      category_id: data.category_id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content_html: data.content_html,
      content_json: data.content_json ?? null,
      cover_image_url: data.cover_image_url ?? null,
      cover_image_alt: data.cover_image_alt ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      status: data.status,
      sort_order: data.sort_order,
      icon_key: data.icon_key ?? null,
      external_href: normalizeHref(data.external_href ?? null),
      author_id: ctx.userId,
      reading_time_min: data.content_html
        ? calcReadingTime(data.content_html)
        : null,
    })
    .select("id")
    .single()

  if (error || !row) {
    console.error("[createReEnergieArticleAction]", error)
    return { ok: false, error: "Erreur lors de la création" }
  }

  revalidatePath("/marketing/re-energie")
  return { ok: true, id: (row as { id: string }).id }
}

export async function updateReEnergieArticleAction(
  id: string,
  input: Partial<ReEnergieArticleInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const before = await getReEnergieArticleById(id)
  if (!before) {
    return { ok: false, error: "Article introuvable" }
  }

  const parsed = reEnergieArticleUpdateSchema.safeParse({
    ...input,
    external_href:
      input.external_href === undefined
        ? undefined
        : normalizeHref(input.external_href as string | null | undefined),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  const data = parsed.data
  const categoryId = data.category_id ?? before.category_id
  const slug = data.slug ?? before.slug
  if (
    data.slug !== undefined || data.category_id !== undefined
  ) {
    if (await isReEnergieArticleSlugTaken(categoryId, slug, id)) {
      return { ok: false, error: "Ce slug est déjà utilisé dans cette catégorie" }
    }
  }

  const payload: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) payload[k] = v
  }
  if (data.external_href !== undefined) {
    payload.external_href = normalizeHref(data.external_href as string | null)
  }
  if (typeof data.content_html === "string") {
    payload.reading_time_min = data.content_html
      ? calcReadingTime(data.content_html)
      : null
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("re_energie_articles")
    .update(payload)
    .eq("id", id)

  if (error) {
    console.error("[updateReEnergieArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de la mise à jour" }
  }

  revalidatePath("/marketing/re-energie")
  revalidatePath(`/marketing/re-energie/${id}`)

  return { ok: true }
}

export async function publishReEnergieArticleAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const before = await getReEnergieArticleById(id)
  const supabase = await createClient()
  const { error } = await supabase
    .from("re_energie_articles")
    .update({ status: "published" })
    .eq("id", id)

  if (error) {
    console.error("[publishReEnergieArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de la publication" }
  }

  revalidatePath("/marketing/re-energie")
  revalidatePath(`/marketing/re-energie/${id}`)
  return { ok: true }
}

export async function archiveReEnergieArticleAction(
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
    .from("re_energie_articles")
    .update({ status: "archived" })
    .eq("id", id)

  if (error) {
    console.error("[archiveReEnergieArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de l'archivage" }
  }

  revalidatePath("/marketing/re-energie")
  revalidatePath(`/marketing/re-energie/${id}`)
  return { ok: true }
}

export async function deleteReEnergieArticleAction(
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
  const { error } = await supabase.from("re_energie_articles").delete().eq("id", id)

  if (error) {
    console.error("[deleteReEnergieArticleAction]", id, error)
    return { ok: false, error: "Erreur lors de la suppression" }
  }

  revalidatePath("/marketing/re-energie")
  return { ok: true }
}
