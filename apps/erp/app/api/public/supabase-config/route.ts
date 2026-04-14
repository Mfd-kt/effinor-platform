import { NextResponse } from "next/server";

import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/supabase/public-env";

/** Toujours dynamique : lit l’environnement du process Node au moment de la requête (Docker / Dokploy). */
export const dynamic = "force-dynamic";

/**
 * Expose URL + clé anon au navigateur quand elles ne sont pas dans le bundle (runtime Docker).
 * La clé anon est publique par conception (RLS) ; ne jamais exposer service_role ici.
 */
export async function GET() {
  const url = getPublicSupabaseUrl();
  const anonKey = getPublicSupabaseAnonKey();
  if (!url || !anonKey) {
    const nonempty = (k: string | undefined) => Boolean(k?.trim());
    return NextResponse.json(
      {
        ok: false as const,
        error: "supabase_public_env_missing",
        /** Indique quelles variables le conteneur voit (sans jamais exposer les valeurs). */
        envPresent: {
          PUBLIC_SUPABASE_URL: nonempty(process.env.PUBLIC_SUPABASE_URL),
          NEXT_PUBLIC_SUPABASE_URL: nonempty(process.env.NEXT_PUBLIC_SUPABASE_URL),
          SUPABASE_URL: nonempty(process.env.SUPABASE_URL),
          PUBLIC_SUPABASE_ANON_KEY: nonempty(process.env.PUBLIC_SUPABASE_ANON_KEY),
          NEXT_PUBLIC_SUPABASE_ANON_KEY: nonempty(
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          ),
          SUPABASE_ANON_KEY: nonempty(process.env.SUPABASE_ANON_KEY),
        },
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true as const, url, anonKey });
}
