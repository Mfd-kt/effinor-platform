"use server"

import { revalidatePath } from "next/cache"

import { getAccessContext } from "@/lib/auth/access-context"
import { isMarketingStaff } from "@/lib/auth/role-codes"
import { createClient } from "@/lib/supabase/server"

import {
  siteSettingsUpdateSchema,
  type SiteSettingsUpdate,
} from "../schemas/site-settings.schema"

export async function updateSiteSettingsAction(
  input: SiteSettingsUpdate
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAccessContext()
  if (ctx.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" }
  }
  if (!isMarketingStaff(ctx.roleCodes)) {
    return { ok: false, error: "Accès refusé" }
  }

  const parsed = siteSettingsUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    }
  }

  const { contact, stats } = parsed.data
  const supabase = await createClient()

  const { error: errContact } = await supabase.from("site_settings").upsert(
    {
      key: "contact",
      value: contact as unknown as Record<string, unknown>,
    },
    { onConflict: "key" }
  )
  if (errContact) {
    console.error("[updateSiteSettingsAction contact]", errContact)
    return { ok: false, error: "Erreur lors de l’enregistrement du contact" }
  }

  const { error: errStats } = await supabase.from("site_settings").upsert(
    {
      key: "stats",
      value: stats as unknown as Record<string, unknown>[],
    },
    { onConflict: "key" }
  )
  if (errStats) {
    console.error("[updateSiteSettingsAction stats]", errStats)
    return { ok: false, error: "Erreur lors de l’enregistrement des statistiques" }
  }

  revalidatePath("/marketing/settings")
  return { ok: true }
}
