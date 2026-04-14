"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { createCockpitRefreshScheduler } from "./cockpit-refresh-controller";

const COCKPIT_REALTIME_MIN_INTERVAL_MS = 3_500;
const COCKPIT_REALTIME_POST_LOCK_MS = 500;

const COCKPIT_REALTIME_TABLES = [
  "commercial_callbacks",
  "lead_sheet_workflows",
  "workflow_event_logs",
  "automation_logs",
] as const;

export type CockpitRealtimeStatus = {
  /** Abonnement Realtime actif (SUBSCRIBED). */
  live: boolean;
  /** Dernière fois qu’un refresh RSC a été déclenché (côté client). */
  lastRefreshAtMs: number;
};

/**
 * Une chaîne Realtime, plusieurs `postgres_changes` — refresh serveur throttlé.
 * RLS Supabase filtre les événements visibles par l’utilisateur.
 */
export function useCockpitRealtime(userId: string | null, enabled: boolean): CockpitRealtimeStatus {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const [lastRefreshAtMs, setLastRefreshAtMs] = useState(() => Date.now());
  const routerRef = useRef(router);
  routerRef.current = router;

  const onRefresh = useCallback(() => {
    setLastRefreshAtMs(Date.now());
    routerRef.current.refresh();
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      setLive(false);
      return;
    }

    let cancelled = false;
    let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
    let channel: ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null = null;

    const scheduler = createCockpitRefreshScheduler({
      minIntervalMs: COCKPIT_REALTIME_MIN_INTERVAL_MS,
      postRunLockMs: COCKPIT_REALTIME_POST_LOCK_MS,
      onRefresh,
      debugLabel: "cockpit-realtime",
    });

    void (async () => {
      const client = await createClient();
      if (cancelled) return;
      supabase = client;

      let ch = client.channel(`cockpit-command-v1-${userId}`);

      for (const table of COCKPIT_REALTIME_TABLES) {
        ch = ch.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => scheduler.request(table),
        );
      }

      ch = ch.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          scheduler.request(`app_notifications:${payload.eventType}`);
        },
      );

      ch.subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") setLive(true);
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") setLive(false);
      });

      channel = ch;
    })();

    return () => {
      cancelled = true;
      setLive(false);
      scheduler.dispose();
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [enabled, userId, onRefresh]);

  return { live, lastRefreshAtMs };
}
