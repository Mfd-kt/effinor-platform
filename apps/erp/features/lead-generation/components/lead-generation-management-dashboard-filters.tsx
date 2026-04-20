"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/utils";

import type {
  ManagementDashboardPeriod,
  ManagementFilterOption,
} from "../queries/get-lead-generation-management-dashboard";

type Props = {
  period: ManagementDashboardPeriod;
  quantifierUserId: string | null;
  ceeSheetId: string | null;
  quantifiers: ManagementFilterOption[];
  ceeSheets: ManagementFilterOption[];
};

function buildQuery(next: {
  period?: ManagementDashboardPeriod;
  quantifierUserId?: string | null;
  ceeSheetId?: string | null;
}): string {
  const p = new URLSearchParams();
  p.set("p", next.period ?? "7d");
  const q = next.quantifierUserId;
  if (q) {
    p.set("q", q);
  }
  const cee = next.ceeSheetId;
  if (cee) {
    p.set("cee", cee);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function LeadGenerationManagementDashboardFilters({
  period,
  quantifierUserId,
  ceeSheetId,
  quantifiers,
  ceeSheets,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const periods: { id: ManagementDashboardPeriod; label: string }[] = [
    { id: "today", label: "Aujourd'hui" },
    { id: "7d", label: "7 jours" },
    { id: "30d", label: "30 jours" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card/40 p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <span className="w-full text-xs font-medium text-muted-foreground sm:w-auto sm:py-1.5">Période</span>
        {periods.map((x) => (
          <button
            key={x.id}
            type="button"
            disabled={pending}
            onClick={() => {
              startTransition(() => {
                router.push(`/lead-generation/management${buildQuery({ period: x.id, quantifierUserId, ceeSheetId })}`);
              });
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              period === x.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[200px] flex-col gap-1 text-xs">
          <span className="font-medium text-muted-foreground">Quantificateur</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            disabled={pending}
            value={quantifierUserId ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              startTransition(() => {
                router.push(`/lead-generation/management${buildQuery({ period, quantifierUserId: v, ceeSheetId })}`);
              });
            }}
          >
            <option value="">Tous</option>
            {quantifiers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[200px] flex-col gap-1 text-xs">
          <span className="font-medium text-muted-foreground">Fiche CEE</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            disabled={pending}
            value={ceeSheetId ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              startTransition(() => {
                router.push(`/lead-generation/management${buildQuery({ period, quantifierUserId, ceeSheetId: v })}`);
              });
            }}
          >
            <option value="">Toutes</option>
            {ceeSheets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
