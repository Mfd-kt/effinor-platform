"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type {
  LeadGenerationCockpitAgentBadge,
  LeadGenerationCockpitAgentRow,
  LeadGenerationOperationalCapacityLevel,
} from "../domain/lead-generation-cockpit";

import { COMMERCIAL_CAPACITY_BLOCK_THRESHOLD } from "../lib/agent-commercial-capacity";

type SortKey =
  | "displayName"
  | "freshStock"
  | "pipelineBacklog"
  | "operationalVolumeTotal"
  | "slaWarning"
  | "slaBreached"
  | "callsLogged"
  | "firstContactsInPeriod"
  | "leadsConvertedInPeriod"
  | "avgHoursToFirstContact"
  | "avgHoursToConversion"
  | "effectiveStockCap"
  | "badge";

const BADGE_LABEL: Record<LeadGenerationCockpitAgentBadge, string> = {
  top_performer: "Top performer",
  solide: "Solide",
  sous_pression: "Sous pression",
  sature: "Saturé",
  a_coacher: "À coacher",
};

const CAPACITY_BADGE_LABEL: Record<LeadGenerationOperationalCapacityLevel, string> = {
  normal: "OK",
  warning: "Élevé",
  blocked: "Max",
};

function capacityBadgeClass(level: LeadGenerationOperationalCapacityLevel): string {
  if (level === "blocked") {
    return "border-rose-500/50 bg-rose-500/10 text-rose-900 dark:text-rose-50";
  }
  if (level === "warning") {
    return "border-amber-500/45 bg-amber-500/10 text-amber-950 dark:text-amber-50";
  }
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100";
}

function fmtHours(h: number | null): string {
  if (h == null || Number.isNaN(h)) {
    return "—";
  }
  return `${h.toFixed(1)} h`;
}

type Props = {
  rows: LeadGenerationCockpitAgentRow[];
};

export function LeadGenerationCockpitAgentTableClient({ rows }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "leadsConvertedInPeriod",
    dir: "desc",
  });

  const sorted = useMemo(() => {
    const mult = sort.dir === "asc" ? 1 : -1;
    const key = sort.key;
    return [...rows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null && vb == null) {
        return a.displayName.localeCompare(b.displayName, "fr");
      }
      if (va == null) {
        return 1;
      }
      if (vb == null) {
        return -1;
      }
      if (typeof va === "number" && typeof vb === "number") {
        return mult * (va - vb) || a.displayName.localeCompare(b.displayName, "fr");
      }
      if (typeof va === "string" && typeof vb === "string") {
        return mult * va.localeCompare(vb, "fr");
      }
      return 0;
    });
  }, [rows, sort]);

  function toggle(k: SortKey) {
    setSort((prev) =>
      prev.key === k ? { key: k, dir: prev.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "desc" },
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortHead label="Agent" k="displayName" current={sort} onSort={toggle} />
            <SortHead label="Stock neuf" k="freshStock" current={sort} onSort={toggle} align="right" />
            <SortHead label="Suivi" k="pipelineBacklog" current={sort} onSort={toggle} align="right" />
            <SortHead
              label={`Vol. total / ${COMMERCIAL_CAPACITY_BLOCK_THRESHOLD}`}
              k="operationalVolumeTotal"
              current={sort}
              onSort={toggle}
              align="right"
            />
            <TableHead className="text-right text-xs">Capacité</TableHead>
            <SortHead label="SLA ⚠" k="slaWarning" current={sort} onSort={toggle} align="right" />
            <SortHead label="SLA ✕" k="slaBreached" current={sort} onSort={toggle} align="right" />
            <SortHead label="Appels" k="callsLogged" current={sort} onSort={toggle} align="right" />
            <SortHead label="1er contact (période)" k="firstContactsInPeriod" current={sort} onSort={toggle} align="right" />
            <SortHead label="Convertis (période)" k="leadsConvertedInPeriod" current={sort} onSort={toggle} align="right" />
            <SortHead label="Δ 1er contact" k="avgHoursToFirstContact" current={sort} onSort={toggle} align="right" />
            <SortHead label="Δ conversion" k="avgHoursToConversion" current={sort} onSort={toggle} align="right" />
            <SortHead label="Plafond" k="effectiveStockCap" current={sort} onSort={toggle} align="right" />
            <TableHead className="text-right text-xs">Injection</TableHead>
            <SortHead label="Badge" k="badge" current={sort} onSort={toggle} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={15} className="text-center text-sm text-muted-foreground">
                Aucun agent sélectionnable.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((r) => (
              <TableRow key={r.agentId}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{r.displayName}</span>
                    {r.email ? <span className="text-xs text-muted-foreground">{r.email}</span> : null}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.freshStock}</TableCell>
                <TableCell className="text-right tabular-nums">{r.pipelineBacklog}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {r.operationalVolumeTotal}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({r.operationalStockNeuf}+{r.operationalSuivi})
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn("font-normal", capacityBadgeClass(r.operationalCapacityLevel))}>
                    {CAPACITY_BADGE_LABEL[r.operationalCapacityLevel]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-amber-700 dark:text-amber-400">{r.slaWarning}</TableCell>
                <TableCell className="text-right tabular-nums text-destructive">{r.slaBreached}</TableCell>
                <TableCell className="text-right tabular-nums">{r.callsLogged}</TableCell>
                <TableCell className="text-right tabular-nums">{r.firstContactsInPeriod}</TableCell>
                <TableCell className="text-right tabular-nums">{r.leadsConvertedInPeriod}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{fmtHours(r.avgHoursToFirstContact)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{fmtHours(r.avgHoursToConversion)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.effectiveStockCap}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      r.suspendInjection ? "text-destructive" : "text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    {r.suspendInjection ? "Suspendue" : "Active"}
                  </span>
                  {r.suspensionReason ? (
                    <span className="mt-0.5 block max-w-[180px] text-[10px] leading-tight text-muted-foreground">
                      {r.suspensionReason}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant={r.badge === "top_performer" ? "default" : "secondary"} className="font-normal">
                    {BADGE_LABEL[r.badge]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SortHead({
  label,
  k,
  current,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  current: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = current.key === k;
  return (
    <TableHead className={cn(align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        {active ? <span className="opacity-70">{current.dir === "asc" ? "↑" : "↓"}</span> : null}
      </button>
    </TableHead>
  );
}
