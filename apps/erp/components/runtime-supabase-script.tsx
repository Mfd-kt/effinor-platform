import {
  EFFINOR_SUPABASE_WINDOW_KEY,
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/supabase/public-env";

/**
 * Injecte la config Supabase publique pour le bundle client quand seules des variables
 * runtime (ex. PUBLIC_SUPABASE_*) sont disponibles après le build Docker.
 *
 * Next.js 16 / React 19 acceptent `<script dangerouslySetInnerHTML>` directement dans
 * l'arbre serveur — `next/script` n'est plus nécessaire et générait un warning console
 * « Encountered a script tag while rendering React component ».
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
    <script
      id="effinor-public-supabase"
      dangerouslySetInnerHTML={{
        __html: `window[${JSON.stringify(EFFINOR_SUPABASE_WINDOW_KEY)}]=${payload};`,
      }}
    />
  );
}
