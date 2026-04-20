import { Badge } from "@/components/ui/badge";
import {
  COMMERCIAL_SLA_STATUS_LABELS,
  type CommercialSlaStatus,
} from "@/features/lead-generation/domain/commercial-pipeline-sla";
import { cn } from "@/lib/utils";

const STYLE: Record<
  CommercialSlaStatus,
  { className: string }
> = {
  on_time: {
    className: "border-border bg-muted/35 text-muted-foreground",
  },
  warning: {
    className:
      "border-orange-500/55 bg-orange-500/15 text-orange-950 dark:border-orange-400/45 dark:bg-orange-500/20 dark:text-orange-50",
  },
  breached: {
    className:
      "border-red-500/55 bg-red-500/15 text-red-950 dark:border-red-400/45 dark:bg-red-500/25 dark:text-red-50",
  },
};

type Props = {
  status: CommercialSlaStatus | string | null | undefined;
  compact?: boolean;
  className?: string;
};

export function CommercialSlaBadge({ status, compact, className }: Props) {
  if (!status || !(status in STYLE)) {
    return (
      <span className={cn("text-[11px] text-muted-foreground", compact ? "text-[10px]" : "")}>—</span>
    );
  }
  const s = status as CommercialSlaStatus;
  const cfg = STYLE[s];
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
      {COMMERCIAL_SLA_STATUS_LABELS[s]}
    </Badge>
  );
}
