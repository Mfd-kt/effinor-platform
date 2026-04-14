import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BeneficiaryStatus } from "@/types/database.types";

import { BENEFICIARY_STATUS_LABELS } from "@/features/beneficiaries/constants";

const toneClass: Record<BeneficiaryStatus, string> = {
  prospect:
    "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100",
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  inactive:
    "border-muted-foreground/30 bg-muted text-muted-foreground dark:bg-muted/50",
  blocked:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
};

type BeneficiaryStatusBadgeProps = {
  status: BeneficiaryStatus;
  className?: string;
};

export function BeneficiaryStatusBadge({
  status,
  className,
}: BeneficiaryStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        toneClass[status],
        className,
      )}
    >
      {BENEFICIARY_STATUS_LABELS[status]}
    </Badge>
  );
}
