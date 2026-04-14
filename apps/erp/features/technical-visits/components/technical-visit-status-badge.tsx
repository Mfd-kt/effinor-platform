import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TechnicalVisitStatus } from "@/types/database.types";

import { TECHNICAL_VISIT_STATUS_LABELS } from "@/features/technical-visits/constants";

const toneClass: Record<TechnicalVisitStatus, string> = {
  to_schedule:
    "border-muted-foreground/30 bg-muted text-muted-foreground dark:bg-muted/50",
  scheduled:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
  performed:
    "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-100",
  report_pending:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  validated:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  refused:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  cancelled:
    "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200",
};

type TechnicalVisitStatusBadgeProps = {
  status: TechnicalVisitStatus;
  className?: string;
};

export function TechnicalVisitStatusBadge({ status, className }: TechnicalVisitStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        toneClass[status],
        className,
      )}
    >
      {TECHNICAL_VISIT_STATUS_LABELS[status]}
    </Badge>
  );
}
