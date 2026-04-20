import { Badge } from "@/components/ui/badge";
import {
  COMMERCIAL_PIPELINE_STATUS_LABELS,
  type CommercialPipelineStatus,
} from "@/features/lead-generation/domain/commercial-pipeline-status";
import { cn } from "@/lib/utils";

const STYLE: Record<
  CommercialPipelineStatus,
  {
    className: string;
  }
> = {
  new: {
    className:
      "border-emerald-500/45 bg-emerald-500/12 text-emerald-950 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-50",
  },
  contacted: {
    className:
      "border-sky-500/45 bg-sky-500/12 text-sky-950 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-50",
  },
  follow_up: {
    className:
      "border-violet-500/45 bg-violet-500/12 text-violet-950 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-50",
  },
  converted: {
    className: "border-border bg-muted/50 text-muted-foreground",
  },
};

type Props = {
  status: CommercialPipelineStatus | string;
  compact?: boolean;
  className?: string;
};

export function CommercialPipelineBadge({ status, compact, className }: Props) {
  const p = (status in STYLE ? status : "new") as CommercialPipelineStatus;
  const cfg = STYLE[p] ?? STYLE.new;
  const label = COMMERCIAL_PIPELINE_STATUS_LABELS[p] ?? COMMERCIAL_PIPELINE_STATUS_LABELS.new;
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
      {label}
    </Badge>
  );
}
