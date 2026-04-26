import { createClient } from "@/lib/supabase/server"

import {
  siteContactSchema,
  siteStatsFormSchema,
} from "../schemas/site-settings.schema"
import type { SiteContactForm, SiteStatItemForm } from "../schemas/site-settings.schema"

export type SiteSettingsForForm = {
  contact: SiteContactForm
  stats: SiteStatItemForm[]
  updatedAt: { contact: string | null; stats: string | null }
}

/**
 * Chargement des clés `contact` et `stats` pour le formulaire ERP.
 * RLS : utilisateur authentifié staff marketing requis côté route.
 */
export async function getSiteSettingsForForm(): Promise<SiteSettingsForForm | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value,updated_at")
    .in("key", ["contact", "stats"])

  if (error) {
    console.error("[getSiteSettingsForForm]", error)
    return null
  }

  const byKey = new Map(
    (data ?? []).map((r: { key: string; value: unknown; updated_at: string }) => [
      r.key,
      { value: r.value, updatedAt: r.updated_at },
    ])
  )

  const contactRaw = byKey.get("contact")?.value
  const statsRaw = byKey.get("stats")?.value

  if (!contactRaw || !statsRaw) {
    return null
  }

  const parsedContact = siteContactSchema.safeParse(contactRaw)
  const parsedStats = siteStatsFormSchema.safeParse(statsRaw)
  if (!parsedContact.success || !parsedStats.success) {
    console.error(
      "[getSiteSettingsForForm] JSON invalide",
      parsedContact.success ? null : parsedContact.error.flatten(),
      parsedStats.success ? null : parsedStats.error.flatten()
    )
    return null
  }

  return {
    contact: parsedContact.data as SiteContactForm,
    stats: parsedStats.data as SiteStatItemForm[],
    updatedAt: {
      contact: byKey.get("contact")?.updatedAt ?? null,
      stats: byKey.get("stats")?.updatedAt ?? null,
    },
  }
}
