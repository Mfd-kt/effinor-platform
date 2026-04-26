import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase côté serveur pour le site vitrine.
 *
 * On utilise le client `@supabase/supabase-js` standard (et non `@supabase/ssr`)
 * car le site vitrine est principalement public/anonyme et n'a pas besoin
 * de gérer une session utilisateur (pas d'auth visible côté visiteur).
 *
 * Les RLS de Supabase font le travail de sécurité (ex. INSERT anon autorisé
 * sur la table `contacts`, SELECT public sur blog_articles/realisations
 * quand status='published').
 *
 * ⚠️ Retourne `null` si les env vars ne sont pas configurées.
 * Ce comportement permet au build Docker de se terminer même sans env vars
 * (ex: preview build, CI sans secrets). Toutes les queries vérifient le null
 * et retournent [] ou null en conséquence. Au runtime en prod, les env vars
 * DOIVENT être configurées dans Dokploy (Build args + Runtime env).
 */
export function createSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // Log uniquement côté serveur, jamais côté client
    if (typeof window === 'undefined') {
      console.warn(
        '[supabase-server] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes — client Supabase non instancié. Les queries DB retourneront des listes vides.'
      )
    }
    return null
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
