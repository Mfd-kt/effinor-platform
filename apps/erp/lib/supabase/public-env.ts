/**
 * URL + clé anon Supabase « publiques » (la clé anon est faite pour le navigateur, protégée par la RLS).
 *
 * - En local : `NEXT_PUBLIC_*` suffit (inliné au build).
 * - En Docker / Dokploy sans build args : définir `PUBLIC_SUPABASE_URL` et `PUBLIC_SUPABASE_ANON_KEY`
 *   au runtime ; le layout serveur transmet l’objet à `RuntimeSupabaseInjectClient` (useLayoutEffect).
 */

export const EFFINOR_SUPABASE_WINDOW_KEY = "__EFFINOR_SUPABASE__" as const;

export type EffinorPublicSupabaseRuntime = {
  url: string;
  anonKey: string;
};

declare global {
  interface Window {
    __EFFINOR_SUPABASE__?: EffinorPublicSupabaseRuntime;
  }
}

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t || undefined;
}

/** Lecture côté serveur / middleware (process.env au runtime). */
export function getPublicSupabaseUrl(): string | undefined {
  return trimEnv(
    process.env.PUBLIC_SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL,
  );
}

export function getPublicSupabaseAnonKey(): string | undefined {
  return trimEnv(
    process.env.PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY,
  );
}

export function requirePublicSupabasePair(): { url: string; anonKey: string } {
  const url = getPublicSupabaseUrl();
  const anonKey = getPublicSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Variables PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY manquantes (ou NEXT_PUBLIC_SUPABASE_* pour le dev / build avec inlining).",
    );
  }
  return { url, anonKey };
}

/** Côté navigateur : préfère la config injectée par le layout, puis le build local. */
export function getBrowserPublicSupabasePair():
  | { url: string; anonKey: string }
  | undefined {
  if (typeof window !== "undefined") {
    const injected = window.__EFFINOR_SUPABASE__;
    if (injected?.url && injected.anonKey) {
      return { url: injected.url, anonKey: injected.anonKey };
    }
  }
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (url && anonKey) return { url, anonKey };
  return undefined;
}

let browserRuntimeFetch: Promise<void> | null = null;

/**
 * Si ni le script du layout ni NEXT_PUBLIC_* ne sont disponibles, charge la config
 * depuis `/api/public/supabase-config` (env lue côté serveur au runtime).
 */
export function ensureBrowserPublicSupabaseRuntime(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (getBrowserPublicSupabasePair()) return Promise.resolve();

  if (!browserRuntimeFetch) {
    browserRuntimeFetch = (async () => {
      try {
        const res = await fetch("/api/public/supabase-config", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) {
          browserRuntimeFetch = null;
          return;
        }
        const data = (await res.json()) as {
          ok?: boolean;
          url?: string;
          anonKey?: string;
        };
        if (data.ok && data.url && data.anonKey) {
          window.__EFFINOR_SUPABASE__ = { url: data.url, anonKey: data.anonKey };
        } else {
          browserRuntimeFetch = null;
        }
      } catch {
        browserRuntimeFetch = null;
      }
    })();
  }
  return browserRuntimeFetch;
}
