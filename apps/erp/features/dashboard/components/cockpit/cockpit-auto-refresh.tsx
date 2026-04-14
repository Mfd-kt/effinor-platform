"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Rafraîchissement léger du RSC pour les compteurs cockpit (pas de realtime sur tout le graphe). */
export function CockpitAutoRefresh({ intervalMs = 120_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        routerRef.current.refresh();
      }
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return null;
}
