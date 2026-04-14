import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { getPublicSupabaseUrl } from "@/lib/supabase/public-env";

/**
 * Client Supabase avec la clé **service_role** — réservé au serveur (actions, routes API).
 * Contourne la RLS : à n’utiliser que derrière un contrôle métier (ex. super_admin).
 */
export function createAdminClient() {
  const url = getPublicSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY et PUBLIC_SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) doivent être définis pour l’administration des utilisateurs.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
