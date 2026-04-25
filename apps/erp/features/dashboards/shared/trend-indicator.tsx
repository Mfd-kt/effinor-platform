import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Trend } from "./types";

type Props = {
  trend: Trend;
  /** Sens « positif » : `higher-is-better` (défaut) inverse les couleurs si direction=down. */
  polarity?: "higher-is-better" | "lower-is-better";
  className?: string;
};

/**
 * Indicateur visuel de tendance ↗ / ↘ / ═ avec pourcentage signé.
 * Le code couleur dépend de la `polarity` (ex. délai de paiement = lower-is-better).
 */
export function TrendIndicator({ trend, polarity = "higher-is-better", className }: Props) {
  const { direction, deltaPct } = trend;
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  const isPositive =
    polarity === "higher-is-better" ? direction === "up" : direction === "down";
  const isNegative =
    polarity === "higher-is-better" ? direction === "down" : direction === "up";

  const tone = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : isNegative
      ? "text-rose-600 dark:text-rose-400"
      : "text-muted-foreground";

  const formatted =
    deltaPct == null
      ? "n/a"
      : `${deltaPct > 0 ? "+" : ""}${deltaPct.toFixed(deltaPct >= 10 || deltaPct <= -10 ? 0 : 1)} %`;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular-nums", tone, className)}
      aria-label={`Tendance : ${formatted}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {formatted}
    </span>
  );
}
