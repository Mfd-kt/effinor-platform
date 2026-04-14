import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseBrowserConfig = {
  url: string;
  anonKey: string;
};

/**
 * Client Supabase pour le navigateur (Vite : variables VITE_*).
 * Chaque app charge ses propres .env ; ne partagez jamais la service role côté client.
 */
export function createSupabaseBrowserClient(config: SupabaseBrowserConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Lit la config depuis import.meta.env (Vite).
 */
export function supabaseConfigFromEnv(): SupabaseBrowserConfig {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) {
    throw new Error(
      "VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis dans .env de l’app.",
    );
  }
  return { url, anonKey };
}
