import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TechnicalStudyStatus } from "@/types/database.types";

import { TECHNICAL_STUDY_STATUS_LABELS } from "@/features/technical-studies/constants";

const tone: Record<TechnicalStudyStatus, string> = {
  draft: "border-muted-foreground/30 bg-muted text-muted-foreground dark:bg-muted/50",
  in_review:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  rejected:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  archived:
    "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200",
};

type TechnicalStudyStatusBadgeProps = {
  status: TechnicalStudyStatus;
  className?: string;
};

export function TechnicalStudyStatusBadge({ status, className }: TechnicalStudyStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", tone[status], className)}>
      {TECHNICAL_STUDY_STATUS_LABELS[status]}
    </Badge>
  );
}
