import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { LEAD_TYPE_LABELS } from "@/features/leads/constants";

export type LeadTypeBadgeVariant = "b2b" | "b2c" | "unknown";

const toneClass: Record<LeadTypeBadgeVariant, string> = {
  b2b: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100",
  b2c:
    "border-green-200 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100",
  unknown:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-950/40 dark:text-slate-200",
};

const dotClass: Record<LeadTypeBadgeVariant, string> = {
  b2b: "bg-blue-500 dark:bg-blue-400",
  b2c: "bg-green-500 dark:bg-green-400",
  unknown: "bg-slate-400 dark:bg-slate-500",
};

type LeadTypeBadgeProps = {
  type: LeadTypeBadgeVariant;
  className?: string;
};

export function LeadTypeBadge({ type, className }: LeadTypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        toneClass[type],
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotClass[type])} aria-hidden />
      {LEAD_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

export function leadTypeForBadge(raw: string | null | undefined): LeadTypeBadgeVariant {
  if (raw === "b2b" || raw === "b2c" || raw === "unknown") return raw;
  return "unknown";
}
