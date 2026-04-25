import type { SupabaseBrowserConfig } from './types'

/**
 * Lit la configuration Supabase depuis les variables d'environnement.
 *
 * Fonctionne en Next.js (process.env) et en Vite (import.meta.env).
 * Priorité : NEXT_PUBLIC_SUPABASE_* > VITE_SUPABASE_* > SUPABASE_*
 *
 * @throws si les variables sont manquantes
 */
export function supabaseConfigFromEnv(): SupabaseBrowserConfig {
  const env = getEnvObject()

  const url =
    env.NEXT_PUBLIC_SUPABASE_URL ??
    env.VITE_SUPABASE_URL ??
    env.SUPABASE_URL ??
    ''

  const anonKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    env.SUPABASE_ANON_KEY ??
    ''

  if (!url || !anonKey) {
    throw new Error(
      '[supabaseConfigFromEnv] Variables Supabase manquantes. Définir NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY (Next.js) ou VITE_SUPABASE_URL/_ANON_KEY (Vite).'
    )
  }

  return { url, anonKey }
}

type NodeLike = { env?: Record<string, string | undefined> }

/**
 * Récupère un objet unifié contenant les vars d'env,
 * quel que soit le framework (Next.js / Vite / Node).
 */
function getEnvObject(): Record<string, string | undefined> {
  // Accès à process.env sans dépendre de @types/node
  const g = globalThis as { process?: NodeLike }
  const nodeEnv: Record<string, string | undefined> = g.process?.env ?? {}

  // Vite (browser + SSR)
  const viteEnv: Record<string, string | undefined> =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
      ? (import.meta as unknown as { env: Record<string, string> }).env
      : {}

  // Priorité : Next.js (process.env) écrase Vite si les deux sont présents
  return { ...viteEnv, ...nodeEnv }
}
