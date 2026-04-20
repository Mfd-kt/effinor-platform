"use client";

import { Flame, ShieldAlert, TrendingDown } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { LeadGenerationAgentPerformanceRow } from "../queries/get-lead-generation-agent-performance-leaderboard";

type Props = {
  rows: LeadGenerationAgentPerformanceRow[];
};

function BadgeCell({ row }: { row: LeadGenerationAgentPerformanceRow }) {
  if (row.performanceBadge === "top") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-950 dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-50">
        <Flame className="size-3.5 shrink-0" aria-hidden />
        Top
      </span>
    );
  }
  if (row.performanceBadge === "at_risk") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/45 bg-orange-500/12 px-2 py-0.5 text-[11px] font-medium text-orange-950 dark:border-orange-400/40 dark:bg-orange-500/18 dark:text-orange-50">
        <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
        Sous pression
      </span>
    );
  }
  if (row.performanceBadge === "low") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/35 bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-800 dark:border-slate-400/30 dark:bg-slate-500/15 dark:text-slate-100">
        <TrendingDown className="size-3.5 shrink-0" aria-hidden />
        À suivre
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

export function LeadGenerationAgentPerformanceLeaderboard({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun agent commercial éligible.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[160px]">Agent</TableHead>
            <TableHead className="text-right tabular-nums">Stock neuf</TableHead>
            <TableHead className="text-right tabular-nums">Suivi</TableHead>
            <TableHead className="text-right tabular-nums">SLA retard</TableHead>
            <TableHead className="text-right tabular-nums">Appels (hors brouillon)</TableHead>
            <TableHead className="text-right tabular-nums">Leads</TableHead>
            <TableHead className="text-right tabular-nums">Plafond eff.</TableHead>
            <TableHead className="min-w-[120px]">Badge</TableHead>
            <TableHead className="min-w-[200px]">Injection</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.agentId}>
              <TableCell className="font-medium">{r.displayName}</TableCell>
              <TableCell className="text-right tabular-nums">{r.freshStock}</TableCell>
              <TableCell className="text-right tabular-nums">{r.pipelineBacklog}</TableCell>
              <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">{r.breachedSla}</TableCell>
              <TableCell className="text-right tabular-nums">{r.callsLogged}</TableCell>
              <TableCell className="text-right tabular-nums">{r.leadsConverted}</TableCell>
              <TableCell className="text-right tabular-nums">{r.effectiveStockCap}</TableCell>
              <TableCell>
                <BadgeCell row={r} />
              </TableCell>
              <TableCell
                className={cn(
                  "text-xs",
                  r.suspendInjection ? "text-amber-800 dark:text-amber-200" : "text-muted-foreground",
                )}
              >
                {r.suspendInjection ? r.suspensionReason ?? "Injection suspendue." : "OK"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
