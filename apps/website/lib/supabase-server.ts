import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase côté serveur pour le site vitrine.
 *
 * On utilise le client `@supabase/supabase-js` standard (et non `@supabase/ssr`)
 * car le site vitrine est principalement public/anonyme et n'a pas besoin
 * de gérer une session utilisateur (pas d'auth visible côté visiteur).
 *
 * Les RLS de Supabase font le travail de sécurité (ex. INSERT anon autorisé
 * sur la table `contacts`).
 */
export function createSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      '[supabase-server] NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis.'
    )
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
