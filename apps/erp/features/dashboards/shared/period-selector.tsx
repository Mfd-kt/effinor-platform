"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/utils";

import {
  DASHBOARD_PERIODS,
  DASHBOARD_PERIOD_LABELS,
  type DashboardPeriod,
} from "./types";

type Props = {
  /** Période actuellement active (résolue côté serveur via `parseDashboardPeriod`). */
  value: DashboardPeriod;
  /** Nom du paramètre d'URL utilisé. Défaut : `period`. */
  paramName?: string;
  className?: string;
};

/**
 * Sélecteur de période persistant dans l'URL (?period=…).
 * Utilise `router.replace` (scroll-free) pour ne pas polluer l'historique.
 */
export function PeriodSelector({ value, paramName = "period", className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function handleSelect(next: DashboardPeriod) {
    if (next === value) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set(paramName, next);
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Période d'analyse"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 text-xs",
        pending && "opacity-70",
        className,
      )}
    >
      {DASHBOARD_PERIODS.map((period) => {
        const active = period === value;
        return (
          <button
            key={period}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => handleSelect(period)}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {DASHBOARD_PERIOD_LABELS[period]}
          </button>
        );
      })}
    </div>
  );
}
