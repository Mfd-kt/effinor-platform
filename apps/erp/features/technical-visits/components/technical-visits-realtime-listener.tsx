"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export type TechnicalVisitsRealtimeListenerProps = {
  /** Filtres `postgres_changes` (ex. `technician_id=eq.<uuid>`). Vide = toute la table (débounce plus long). */
  filters: string[];
  debounceMs: number;
};

/**
 * Abonnement Realtime sur `technical_visits` pour rafraîchir la page (RSC) sans rechargement manuel.
 * Filtres fournis par le serveur (périmètre liste ou `id=eq.<uuid>` sur la fiche).
 */
export function TechnicalVisitsRealtimeListener({
  filters,
  debounceMs,
}: TechnicalVisitsRealtimeListenerProps) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabaseRef: {
      current: Awaited<ReturnType<typeof createClient>> | null;
    } = { current: null };
    const channelRef: {
      current: ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null;
    } = { current: null };

    const scheduleRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        router.refresh();
      }, debounceMs);
    };

    void (async () => {
      const supabase = await createClient();
      if (cancelled) return;
      supabaseRef.current = supabase;

      const channelKey =
        filters.length > 0
          ? `rt-vt-${filters.map((f) => f.replace(/[^a-zA-Z0-9=_-]/g, "_")).join("__")}`
          : "rt-vt-all";
      const channel = supabase.channel(channelKey);
      channelRef.current = channel;

      const attach = (filter?: string) => {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "technical_visits",
            ...(filter ? { filter } : {}),
          },
          () => {
            scheduleRefresh();
          },
        );
      };

      if (filters.length === 0) {
        attach();
      } else {
        for (const f of filters) {
          attach(f);
        }
      }

      channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const ch = channelRef.current;
      const sb = supabaseRef.current;
      if (ch && sb) sb.removeChannel(ch);
      channelRef.current = null;
      supabaseRef.current = null;
    };
  }, [router, debounceMs, JSON.stringify(filters)]);

  return null;
}
