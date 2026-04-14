import { createBrowserClient } from "@supabase/ssr/dist/module/createBrowserClient";

import type { Database } from "@/types/database.types";
import {
  ensureBrowserPublicSupabaseRuntime,
  getBrowserPublicSupabasePair,
} from "@/lib/supabase/public-env";

export async function createClient() {
  await ensureBrowserPublicSupabaseRuntime();
  const pair = getBrowserPublicSupabasePair();
  if (!pair) {
    throw new Error(
      "Configuration Supabase publique manquante : définir NEXT_PUBLIC_SUPABASE_* (dev/build) ou PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY dans l’environnement du conteneur (Dokploy).",
    );
  }

  return createBrowserClient<Database>(pair.url, pair.anonKey);
}
