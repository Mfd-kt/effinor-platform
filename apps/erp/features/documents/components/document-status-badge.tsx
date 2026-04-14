import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types/database.types";

import { DOCUMENT_STATUS_LABELS } from "@/features/documents/constants";

const tone: Record<DocumentStatus, string> = {
  draft: "border-muted-foreground/30 bg-muted text-muted-foreground dark:bg-muted/50",
  pending_review:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  valid:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  rejected:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  superseded:
    "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200",
};

type DocumentStatusBadgeProps = {
  status: DocumentStatus;
  className?: string;
};

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal", tone[status], className)}>
      {DOCUMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

type SignIndicatorProps = {
  label: string;
  value: boolean;
  className?: string;
};

/** Indicateur sobre pour signature client / entreprise (liste ou fiche). */
export function DocumentSignIndicator({ label, value, className }: SignIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs tabular-nums",
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
      title={label}
    >
      {value ? "✓" : "—"}
    </span>
  );
}

type ComplianceIndicatorProps = {
  value: boolean | null;
  className?: string;
};

export function DocumentComplianceIndicator({ value, className }: ComplianceIndicatorProps) {
  if (value === null) {
    return (
      <span
        className={cn(
          "inline-flex rounded border border-border bg-muted/30 px-1.5 py-0.5 text-xs text-muted-foreground",
          className,
        )}
      >
        —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex rounded border px-1.5 py-0.5 text-xs",
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30",
        className,
      )}
    >
      {value ? "Conforme" : "Non conforme"}
    </span>
  );
}
