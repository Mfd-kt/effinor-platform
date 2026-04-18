"use client";

import { Badge } from "@/components/ui/badge";
import type { LeadGenerationDispatchQueueStatus } from "@/features/lead-generation/domain/statuses";
import { cn } from "@/lib/utils";

const LABELS: Record<LeadGenerationDispatchQueueStatus, string> = {
  ready_now: "Prêt maintenant",
  enrich_first: "Enrichir avant",
  review: "À revoir",
  low_value: "Faible valeur",
  do_not_dispatch: "Ne pas diffuser",
};

const VARIANT: Partial<Record<LeadGenerationDispatchQueueStatus, "default" | "secondary" | "destructive" | "outline">> = {
  ready_now: "default",
  enrich_first: "secondary",
  review: "outline",
  low_value: "outline",
  do_not_dispatch: "destructive",
};

type Props = {
  status: LeadGenerationDispatchQueueStatus;
  /** Raison courte (une ligne). */
  reason?: string | null;
  compact?: boolean;
  /** Liste / table : uniquement le badge, la raison en infobulle (évite « Prêt m… »). */
  tooltipReasonOnly?: boolean;
  className?: string;
};

export function LeadGenerationDispatchQueueBadge({
  status,
  reason,
  compact,
  tooltipReasonOnly,
  className,
}: Props) {
  const label = LABELS[status] ?? status;
  const variant = VARIANT[status] ?? "outline";
  const detail = reason?.trim() || null;
  const title = [label, detail].filter(Boolean).join(" — ") || label;

  return (
    <div className={cn("flex flex-col gap-0.5", className)} title={tooltipReasonOnly ? title : undefined}>
      <Badge
        variant={variant}
        className={cn("w-fit shrink-0 whitespace-nowrap text-xs font-medium", compact && "text-[11px]")}
      >
        {label}
      </Badge>
      {detail && !tooltipReasonOnly ? (
        <span
          className={cn(
            "max-w-[220px] truncate text-muted-foreground",
            compact ? "text-[10px] leading-tight" : "text-[11px]",
          )}
          title={detail}
        >
          {detail}
        </span>
      ) : null}
    </div>
  );
}
