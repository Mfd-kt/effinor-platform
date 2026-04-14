"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

import { cn } from "@/lib/utils";

import { useCockpitRealtime } from "./useCockpitRealtime";

type Props = {
  userId: string;
  children: React.ReactNode;
};

function formatAgo(ms: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 5) return "à l’instant";
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  return `il y a ${Math.floor(m / 60)} h`;
}

/**
 * Active Realtime + refresh RSC throttlé pour /cockpit. Les agrégats restent côté serveur.
 */
export function CommandCockpitRealtimeBoundary({ userId, children }: Props) {
  const { live, lastRefreshAtMs } = useCockpitRealtime(userId, true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative">
      <div
        className={cn(
          "mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground",
          "rounded-md border border-border/80 bg-muted/20 px-2 py-1.5",
        )}
        aria-live="polite"
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
            live ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
              : "bg-amber-500/10 text-amber-900 dark:text-amber-200",
          )}
        >
          <Radio className={cn("size-3", live && "animate-pulse")} aria-hidden />
          {live ? "Mise à jour en direct" : "Connexion temps réel…"}
        </span>
        <span className="tabular-nums">Dernier rafraîchissement auto : {formatAgo(lastRefreshAtMs)}</span>
      </div>
      {children}
    </div>
  );
}
