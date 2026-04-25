import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseBrowserConfig } from './types'

/**
 * Crée un client Supabase côté navigateur.
 *
 * Pour Next.js (SSR), préférez @supabase/ssr dans vos apps.
 * Ce helper est destiné aux apps Vite ou aux usages purement client-side.
 *
 * @example
 *   const supabase = createSupabaseBrowserClient({
 *     url: import.meta.env.VITE_SUPABASE_URL,
 *     anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
 *   })
 */
export function createSupabaseBrowserClient(
  config: SupabaseBrowserConfig
): SupabaseClient {
  if (!config.url || !config.anonKey) {
    throw new Error(
      'createSupabaseBrowserClient: url et anonKey sont requis.'
    )
  }
  return createClient(config.url, config.anonKey)
}
