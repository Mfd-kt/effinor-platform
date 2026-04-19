"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "low" | "medium" | "high";

export function LeadGenerationClosingReadinessBadge({
  status,
  score,
  compact,
}: {
  status: Status;
  score?: number;
  compact?: boolean;
}) {
  const label =
    status === "high"
      ? "Closing fort"
      : status === "medium"
        ? "Closing moyen"
        : "Closing faible";
  const cls =
    status === "high"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
      : status === "medium"
        ? "border-amber-500/35 bg-amber-500/12 text-amber-50"
        : "border-border bg-muted/50 text-muted-foreground";

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", compact ? "text-[10px]" : "text-xs", cls)}
      title={score != null ? `Score closing : ${score}` : undefined}
    >
      {label}
      {score != null && !compact ? ` · ${score}` : null}
    </Badge>
  );
}
