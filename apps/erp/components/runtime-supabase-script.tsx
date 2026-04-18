/* App Router : `beforeInteractive` au root layout est le mode supporté pour injecter avant l’hydratation. */
/* eslint-disable @next/next/no-before-interactive-script-outside-document */
import Script from "next/script";

import {
  EFFINOR_SUPABASE_WINDOW_KEY,
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/supabase/public-env";

/**
 * Injecte la config Supabase publique pour le bundle client quand seules des variables
 * runtime (ex. PUBLIC_SUPABASE_*) sont disponibles après le build Docker.
 * `next/script` + `beforeInteractive` : exécution autorisée par React/Next (pas de `<script>` brut dans l’arbre).
 */
export function RuntimeSupabaseScript() {
  const url = getPublicSupabaseUrl();
  const anonKey = getPublicSupabaseAnonKey();
  if (!url || !anonKey) return null;

  const payload = JSON.stringify({ url, anonKey } satisfies {
    url: string;
    anonKey: string;
  });

  return (
    <Script
      id="effinor-public-supabase"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `window[${JSON.stringify(EFFINOR_SUPABASE_WINDOW_KEY)}]=${payload};`,
      }}
    />
  );
}
