import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AdminStatus,
  OperationStatus,
  SalesStatus,
  TechnicalStatus,
} from "@/types/database.types";

import {
  ADMIN_STATUS_LABELS,
  OPERATION_STATUS_LABELS,
  SALES_STATUS_LABELS,
  TECHNICAL_STATUS_LABELS,
} from "@/features/operations/constants";

const operationTone: Record<OperationStatus, string> = {
  draft:
    "border-muted-foreground/30 bg-muted text-muted-foreground dark:bg-muted/50",
  technical_qualification:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
  quote_preparation:
    "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100",
  quote_sent:
    "border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-100",
  quote_signed:
    "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-100",
  installation_planned:
    "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-100",
  installation_in_progress:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
  installation_completed:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  delivered_without_install:
    "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100",
  cee_compliance_review:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  dossier_complete:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  anomaly_to_resubmit:
    "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-100",
  polluter_filed:
    "border-lime-200 bg-lime-50 text-lime-950 dark:border-lime-800 dark:bg-lime-950/30 dark:text-lime-100",
  cofrac_control:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-950 dark:border-fuchsia-800 dark:bg-fuchsia-950/30 dark:text-fuchsia-100",
  invoicing_call:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  payment_pending:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  prime_paid:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  cancelled_off_target:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  not_eligible:
    "border-stone-200 bg-stone-100 text-stone-900 dark:border-stone-600 dark:bg-stone-900/40 dark:text-stone-100",
  cancelled_by_client:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  delivery_requested:
    "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100",
  in_progress:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
  on_hold:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  cancelled:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  archived:
    "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200",
};

const salesTone: Record<SalesStatus, string> = {
  draft: "border-muted-foreground/30 bg-muted text-muted-foreground dark:bg-muted/50",
  to_contact:
    "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100",
  qualified:
    "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-100",
  proposal:
    "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100",
  quote_sent:
    "border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-100",
  quote_signed:
    "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-100",
  won: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  lost: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  stalled:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
};

const adminTone: Record<AdminStatus, string> = {
  pending:
    "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100",
  in_review:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
  complete:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  blocked:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
  archived:
    "border-muted-foreground/30 bg-muted text-muted-foreground dark:bg-muted/50",
};

const technicalTone: Record<TechnicalStatus, string> = {
  pending:
    "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100",
  study_in_progress:
    "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100",
  validated:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
  blocked:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100",
};

type OperationStatusBadgeProps = {
  status: OperationStatus;
  className?: string;
};

export function OperationStatusBadge({ status, className }: OperationStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        operationTone[status],
        className,
      )}
    >
      {OPERATION_STATUS_LABELS[status]}
    </Badge>
  );
}

type SalesStatusBadgeProps = {
  status: SalesStatus;
  className?: string;
};

export function SalesStatusBadge({ status, className }: SalesStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        salesTone[status],
        className,
      )}
    >
      {SALES_STATUS_LABELS[status]}
    </Badge>
  );
}

type AdminStatusBadgeProps = {
  status: AdminStatus;
  className?: string;
};

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        adminTone[status],
        className,
      )}
    >
      {ADMIN_STATUS_LABELS[status]}
    </Badge>
  );
}

type TechnicalStatusBadgeProps = {
  status: TechnicalStatus;
  className?: string;
};

export function TechnicalStatusBadge({ status, className }: TechnicalStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        technicalTone[status],
        className,
      )}
    >
      {TECHNICAL_STATUS_LABELS[status]}
    </Badge>
  );
}
