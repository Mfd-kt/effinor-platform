"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";

export function AgentSheetSelector({
  sheets,
  activeSheetId,
  onSelect,
}: {
  sheets: AgentAvailableSheet[];
  activeSheetId: string | null;
  onSelect: (sheetId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sheets.map((sheet) => {
        const active = sheet.id === activeSheetId;
        return (
          <button
            key={sheet.id}
            type="button"
            onClick={() => onSelect(sheet.id)}
            className={cn(
              "flex min-w-[220px] flex-col rounded-xl border px-4 py-3 text-left transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-muted/40",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{sheet.label}</span>
              <Badge variant={active ? "default" : "secondary"}>{sheet.code}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {sheet.simulatorKey ? <Badge variant="outline">{sheet.simulatorKey}</Badge> : null}
              {sheet.teamName ? <Badge variant="outline">{sheet.teamName}</Badge> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
