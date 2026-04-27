"use client";

import { useLayoutEffect } from "react";

import { type EffinorPublicSupabaseRuntime } from "@/lib/supabase/public-env";

type Props = {
  /** Résolu côté serveur (Docker / env runtime) et sérialisé — pas d’accès `PUBLIC_*` côté navigateur. */
  config: EffinorPublicSupabaseRuntime | null;
};

/**
 * Remplace l’injection par `<script>` (refusé par React en rendu client / overlay Next).
 * `useLayoutEffect` s’exécute avant la peinture, avant la plupart des effets enfants.
 */
export function RuntimeSupabaseInjectClient({ config }: Props) {
  useLayoutEffect(() => {
    if (config?.url && config.anonKey) {
      window.__EFFINOR_SUPABASE__ = { url: config.url, anonKey: config.anonKey };
    }
  }, [config]);

  return null;
}
