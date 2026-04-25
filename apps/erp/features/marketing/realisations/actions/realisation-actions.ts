"use server"

import { revalidatePath } from "next/cache"

import { getAccessContext } from "@/lib/auth/access-context"
import { isMarketingStaff } from "@/lib/auth/role-codes"
import { createClient } from "@/lib/supabase/server"

import { isRealisationSlugTaken } from "../queries/get-realisations"
import {
  realisationSchema,
  realisationUpdateSchema,
  type RealisationInput,
} from "../schemas/realisation.schema"

// ─── CREATE ─────────────────────────────────────────────────────────────────

export async function createRealisationAction(
  input: RealisationInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = realisationSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  if (await isRealisationSlugTaken(parsed.data.slug)) {
    return { ok: false, error: "Ce slug est déjà utilisé" }
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("realisations")
    .insert({ ...parsed.data })
    .select("id")
    .single()

  if (error || !row) {
    console.error("[createRealisationAction]", error)
    return { ok: false, error: "Erreur lors de la création" }
  }

  revalidatePath("/marketing/realisations")
  return { ok: true, id: row.id }
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────

export async function updateRealisationAction(
  id: string,
  input: Partial<RealisationInput>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = realisationUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  if (parsed.data.slug && (await isRealisationSlugTaken(parsed.data.slug, id))) {
    return { ok: false, error: "Ce slug est déjà utilisé" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("realisations")
    .update(parsed.data)
    .eq("id", id)

  if (error) {
    console.error("[updateRealisationAction]", id, error)
    return { ok: false, error: "Erreur lors de la mise à jour" }
  }

  revalidatePath("/marketing/realisations")
  revalidatePath(`/marketing/realisations/${id}`)
  return { ok: true }
}

// ─── PUBLISH ────────────────────────────────────────────────────────────────

export async function publishRealisationAction(
  id: string,
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
    .from("realisations")
    .update({ status: "published" })
    .eq("id", id)

  if (error) {
    console.error("[publishRealisationAction]", id, error)
    return { ok: false, error: "Erreur lors de la publication" }
  }

  revalidatePath("/marketing/realisations")
  revalidatePath(`/marketing/realisations/${id}`)
  return { ok: true }
}

// ─── ARCHIVE ────────────────────────────────────────────────────────────────

export async function archiveRealisationAction(
  id: string,
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
    .from("realisations")
    .update({ status: "archived" })
    .eq("id", id)

  if (error) {
    console.error("[archiveRealisationAction]", id, error)
    return { ok: false, error: "Erreur lors de l'archivage" }
  }

  revalidatePath("/marketing/realisations")
  return { ok: true }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────

export async function deleteRealisationAction(
  id: string,
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
    .from("realisations")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[deleteRealisationAction]", id, error)
    return { ok: false, error: "Erreur lors de la suppression" }
  }

  revalidatePath("/marketing/realisations")
  return { ok: true }
}
