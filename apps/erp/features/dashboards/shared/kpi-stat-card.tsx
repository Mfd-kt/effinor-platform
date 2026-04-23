import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { TrendIndicator } from "./trend-indicator";
import type { Trend } from "./types";

type Props = {
  label: string;
  value: string | number;
  /** Sous-libellé (ex. « vs période précédente », unité, contexte). */
  sublabel?: string;
  icon?: LucideIcon;
  trend?: Trend;
  trendPolarity?: "higher-is-better" | "lower-is-better";
  className?: string;
};

/**
 * Carte KPI compacte : libellé, valeur principale (tabular-nums), tendance optionnelle.
 * Conçue pour s'aligner dans une grille 2/4/5 colonnes selon le viewport.
 */
export function KpiStatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  trendPolarity,
  className,
}: Props) {
  return (
    <Card className={cn("gap-2 py-4", className)}>
      <div className="flex items-start justify-between gap-3 px-4">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        </div>
        {Icon ? (
          <div className="shrink-0 rounded-lg bg-muted p-2 text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </div>
        ) : null}
      </div>
      {(sublabel || trend) && (
        <div className="flex items-center justify-between gap-2 px-4 pt-1">
          {sublabel ? (
            <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
          ) : (
            <span />
          )}
          {trend ? <TrendIndicator trend={trend} polarity={trendPolarity} /> : null}
        </div>
      )}
    </Card>
  );
}
