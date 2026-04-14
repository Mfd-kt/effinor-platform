"use client";

import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const WORKFLOW_STATUS_FR: Record<string, string> = {
  draft: "Brouillon",
  simulation_done: "Simulation validée",
  to_confirm: "À confirmer",
  qualified: "Qualifié",
  docs_prepared: "Docs préparés",
  to_close: "En clôture",
  agreement_sent: "Accord envoyé",
  agreement_signed: "Signé",
  quote_pending: "Devis en attente",
  quote_sent: "Devis envoyé",
  quote_signed: "Devis signé",
  technical_visit_pending: "VT à planifier",
  technical_visit_done: "VT réalisée",
  installation_pending: "Installation en attente",
  cee_deposit_pending: "Dépôt CEE en attente",
  cee_deposited: "CEE déposé",
  paid: "Payé",
  lost: "Perdu",
};

export function workflowStatusLabel(status: string): string {
  return WORKFLOW_STATUS_FR[status] ?? status;
}

export function workflowStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (["to_confirm", "simulation_done", "agreement_sent", "to_close"].includes(status)) return "default";
  if (["qualified", "docs_prepared", "draft", "quote_pending", "quote_sent"].includes(status)) return "secondary";
  if (status === "lost") return "destructive";
  if (["agreement_signed", "paid", "quote_signed", "cee_deposited"].includes(status)) return "outline";
  return "outline";
}

export function crmFormatEur(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value,
  );
}

export function crmFormatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function crmFormatOptionalDate(iso: string | null): string {
  if (!iso) return "—";
  return crmFormatUpdated(iso);
}

export type CrmSortKey = "updated" | "company" | "saving" | "score" | "followUp";

export function CrmSortableHead({
  label,
  active,
  dir,
  onToggle,
  className,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onToggle: () => void;
  className?: string;
}) {
  return (
    <TableHead
      className={cn("bg-muted/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
    >
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted/80 hover:text-foreground"
      >
        {label}
        {active ? (
          dir === "desc" ? (
            <ArrowDownAZ className="size-3.5 opacity-70" aria-hidden />
          ) : (
            <ArrowUpAZ className="size-3.5 opacity-70" aria-hidden />
          )
        ) : null}
      </button>
    </TableHead>
  );
}

export function CrmQueueTabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0 text-[11px] tabular-nums",
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
