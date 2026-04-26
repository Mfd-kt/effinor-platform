"use server"

import { revalidatePath } from "next/cache"

import { getAccessContext } from "@/lib/auth/access-context"
import { isMarketingStaff } from "@/lib/auth/role-codes"
import { createClient } from "@/lib/supabase/server"

import {
  testimonialSchema,
  testimonialUpdateSchema,
  type TestimonialInput,
} from "../schemas/testimonial.schema"

// ─── CREATE ─────────────────────────────────────────────────────────────────

export async function createTestimonialAction(
  input: TestimonialInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = testimonialSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("testimonials")
    .insert({ ...parsed.data })
    .select("id")
    .single()

  if (error || !row) {
    console.error("[createTestimonialAction]", error)
    return { ok: false, error: "Erreur lors de la création" }
  }

  revalidatePath("/marketing/testimonials")
  return { ok: true, id: row.id }
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────

export async function updateTestimonialAction(
  id: string,
  input: Partial<TestimonialInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = testimonialUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("testimonials")
    .update(parsed.data)
    .eq("id", id)

  if (error) {
    console.error("[updateTestimonialAction]", id, error)
    return { ok: false, error: "Erreur lors de la mise à jour" }
  }

  revalidatePath("/marketing/testimonials")
  revalidatePath(`/marketing/testimonials/${id}`)
  return { ok: true }
}

// ─── PUBLISH / ARCHIVE / DELETE ──────────────────────────────────────────────

export async function publishTestimonialAction(
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
    .from("testimonials")
    .update({ status: "published" })
    .eq("id", id)

  if (error) {
    console.error("[publishTestimonialAction]", id, error)
    return { ok: false, error: "Erreur lors de la publication" }
  }

  revalidatePath("/marketing/testimonials")
  revalidatePath(`/marketing/testimonials/${id}`)
  return { ok: true }
}

export async function archiveTestimonialAction(
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
    .from("testimonials")
    .update({ status: "archived" })
    .eq("id", id)

  if (error) {
    console.error("[archiveTestimonialAction]", id, error)
    return { ok: false, error: "Erreur lors de l'archivage" }
  }

  revalidatePath("/marketing/testimonials")
  return { ok: true }
}

export async function deleteTestimonialAction(
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
  const { error } = await supabase.from("testimonials").delete().eq("id", id)

  if (error) {
    console.error("[deleteTestimonialAction]", id, error)
    return { ok: false, error: "Erreur lors de la suppression" }
  }

  revalidatePath("/marketing/testimonials")
  return { ok: true }
}
