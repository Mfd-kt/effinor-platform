"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommercialCallbackSheet } from "@/features/commercial-callbacks/components/commercial-callback-sheet";
import { CommercialCallbacksSection } from "@/features/commercial-callbacks/components/commercial-callbacks-section";
import {
  computeCallbackPerformanceStats,
  computeCommercialCallbackKpis,
} from "@/features/commercial-callbacks/lib/commercial-callback-metrics";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

const UNASSIGNED_VALUE = "__unassigned__";

type CommercialCallbacksTeamClientProps = {
  rows: CommercialCallbackRow[];
  agentNameById: Record<string, string>;
};

export function CommercialCallbacksTeamClient({
  rows,
  agentNameById,
}: CommercialCallbacksTeamClientProps) {
  const router = useRouter();
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CommercialCallbackRow | null>(null);

  const hasUnassigned = useMemo(
    () => rows.some((r) => r.assigned_agent_user_id == null),
    [rows],
  );

  const sortedAgentIds = useMemo(() => {
    const ids = [
      ...new Set(
        rows.map((r) => r.assigned_agent_user_id).filter((id): id is string => id != null && id !== ""),
      ),
    ];
    return ids.sort((a, b) =>
      (agentNameById[a] ?? a).localeCompare(agentNameById[b] ?? b, "fr"),
    );
  }, [rows, agentNameById]);

  const filteredRows = useMemo(() => {
    if (agentFilter === "all") return rows;
    if (agentFilter === UNASSIGNED_VALUE) {
      return rows.filter((r) => r.assigned_agent_user_id == null);
    }
    return rows.filter((r) => r.assigned_agent_user_id === agentFilter);
  }, [rows, agentFilter]);

  const kpis = useMemo(
    () => computeCommercialCallbackKpis(filteredRows),
    [filteredRows],
  );
  const performance = useMemo(
    () => computeCallbackPerformanceStats(filteredRows),
    [filteredRows],
  );

  const labelsWithUnassigned = useMemo(() => {
    const m = { ...agentNameById };
    for (const id of sortedAgentIds) {
      if (!m[id]) m[id] = "Agent";
    }
    return m;
  }, [agentNameById, sortedAgentIds]);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:max-w-sm">
        <Label htmlFor="team-callback-agent-filter">Filtrer par agent</Label>
        <Select
          value={agentFilter}
          onValueChange={(v) => setAgentFilter(v ?? "all")}
        >
          <SelectTrigger id="team-callback-agent-filter" className="w-full">
            <SelectValue placeholder="Tous les agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les agents</SelectItem>
            {hasUnassigned ? (
              <SelectItem value={UNASSIGNED_VALUE}>Non assigné</SelectItem>
            ) : null}
            {sortedAgentIds.map((id) => (
              <SelectItem key={id} value={id}>
                {labelsWithUnassigned[id] ?? id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CommercialCallbacksSection
        rows={filteredRows}
        kpis={kpis}
        performance={performance}
        onOpenNew={() => {}}
        onEdit={(row) => {
          setEditing(row);
          setSheetOpen(true);
        }}
        assignedAgentLabels={labelsWithUnassigned}
        directorTeamMode
      />

      <CommercialCallbackSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSaved={refresh}
      />
    </div>
  );
}
