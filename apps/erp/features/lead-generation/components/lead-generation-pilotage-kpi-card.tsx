"use client";

import { Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  isText?: boolean;
  /** Définition métier courte affichée au survol. */
  tooltip?: string;
};

/**
 * Carte KPI Pilotage (Suivi) — mêmes dimensions que l’ancien `KpiCard` local,
 * avec option d’info-bulle.
 */
export function LeadGenerationPilotageKpiCard({ label, value, hint, isText, tooltip }: Props) {
  return (
    <Card className="border-border/80 bg-card/60 shadow-sm">
      <CardHeader className="space-y-1 pb-2 pt-4">
        <div className="flex min-w-0 items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              {tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="mt-0.5 inline-flex shrink-0 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Définition de l'indicateur"
                    >
                      <Info className="size-3" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            {hint ? <p className="text-[10px] leading-snug text-muted-foreground/90">{hint}</p> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("pb-4 pt-0", isText ? "text-lg font-semibold" : "text-2xl font-semibold tabular-nums")}>
        {value}
      </CardContent>
    </Card>
  );
}
