"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveAgentSimulatorHeadlines } from "@/features/cee-workflows/lib/agent-simulator-headlines";
import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";

export function AgentSimulatorContextCard({
  sheet,
  previewResult,
}: {
  sheet: AgentAvailableSheet;
  previewResult: SimulatorComputedResult | null;
}) {
  const h = resolveAgentSimulatorHeadlines(sheet.label, sheet.code, previewResult);

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span>{h.contextTitle}</span>
          <Badge variant="secondary">{h.contextBadge}</Badge>
        </CardTitle>
        <CardDescription>{h.contextDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {sheet.simulatorKey ? <Badge variant="outline">Simulateur {sheet.simulatorKey}</Badge> : null}
          {previewResult?.ceeSolution?.solution === "PAC" ? (
            <Badge variant="outline" className="border-sky-500/40 text-sky-800 dark:text-sky-200">
              Recommandation PAC
            </Badge>
          ) : null}
          {sheet.teamName ? <Badge variant="outline">{sheet.teamName}</Badge> : null}
          {sheet.roles.map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </div>
        {sheet.description ? <p className="text-muted-foreground">{sheet.description}</p> : null}
        {sheet.controlPoints ? (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-muted-foreground">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground/70">Rappel / angle commercial</div>
            <div className="line-clamp-4 whitespace-pre-wrap text-xs">{sheet.controlPoints}</div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
