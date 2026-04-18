import { Badge } from "@/components/ui/badge";
import type { LeadGenerationCommercialPriority } from "@/features/lead-generation/domain/statuses";
import { cn } from "@/lib/utils";

const STYLE: Record<
  LeadGenerationCommercialPriority,
  { label: string; className: string }
> = {
  critical: {
    label: "Critique",
    className:
      "border-rose-400/55 bg-rose-500/15 text-rose-950 shadow-sm dark:border-rose-400/50 dark:bg-rose-500/25 dark:text-rose-50",
  },
  high: {
    label: "Élevée",
    className:
      "border-amber-400/55 bg-amber-500/15 text-amber-950 shadow-sm dark:border-amber-400/45 dark:bg-amber-500/20 dark:text-amber-50",
  },
  normal: {
    label: "Normale",
    className: "border-border bg-muted/40 text-foreground",
  },
  low: {
    label: "Faible",
    className: "border-muted-foreground/30 bg-muted/30 text-muted-foreground",
  },
};

type Props = {
  priority: LeadGenerationCommercialPriority | string;
  compact?: boolean;
  className?: string;
};

export function LeadGenerationCommercialPriorityBadge({ priority, compact, className }: Props) {
  const p = (priority in STYLE ? priority : "normal") as LeadGenerationCommercialPriority;
  const cfg = STYLE[p] ?? STYLE.normal;
  return (
    <Badge
      variant="outline"
      className={cn(
        cfg.className,
        "font-medium",
        compact ? "px-1.5 py-0 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      {cfg.label}
    </Badge>
  );
}
