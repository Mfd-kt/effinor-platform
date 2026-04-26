import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé **service_role** — réservé au serveur
 * (API routes, Server Actions). Contourne la RLS : à n'utiliser que derrière
 * un contrôle métier strict (validation Zod + rate-limit).
 *
 * ⚠️ Retourne `null` si les env vars ne sont pas configurées, afin que le
 * build Docker ne plante pas sans secret. Au runtime en prod, l'absence de
 * clé retournera une erreur 503 propre côté API.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    if (typeof window === 'undefined') {
      console.warn(
        '[supabase-admin] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante — client admin non instancié.'
      )
    }
    return null
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
