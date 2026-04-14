"use client";

/**
 * Stratégie realtime cockpit (documentée) :
 * - A. Temps réel : écoute `lead_sheet_workflows` (changements qui impactent files / funnel).
 * - B. Refresh serveur : `router.refresh()` **throttlé** pour recharger les RSC (agrégations lourdes côté serveur).
 * - C. Secours : polling lent si le client reste ouvert (évite état trop stale si Realtime indisponible).
 *
 * Les graphiques historiques ne sont pas recalculés côté client : ils suivent le refresh RSC.
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

const REALTIME_THROTTLE_MS = 3200;

export function CockpitRealtimeBoundary({
  children,
  fallbackPollMs = 180_000,
}: {
  children: React.ReactNode;
  /** Filet de sécurité : refresh périodique si Realtime ne couvre pas un cas. */
  fallbackPollMs?: number;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  const lastRunRef = useRef(0);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const throttledRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRunRef.current < REALTIME_THROTTLE_MS) return;
    lastRunRef.current = now;
    routerRef.current.refresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
    let channel: ReturnType<Awaited<ReturnType<typeof createClient>>["channel"]> | null = null;

    void (async () => {
      const client = await createClient();
      if (cancelled) return;
      supabase = client;
      const ch = client
        .channel("cockpit-lead-sheet-workflows")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "lead_sheet_workflows" },
          () => throttledRefresh(),
        )
        .subscribe();
      channel = ch;
    })();

    return () => {
      cancelled = true;
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [throttledRefresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") throttledRefresh();
    }, fallbackPollMs);
    return () => window.clearInterval(id);
  }, [fallbackPollMs, throttledRefresh]);

  return <>{children}</>;
}
