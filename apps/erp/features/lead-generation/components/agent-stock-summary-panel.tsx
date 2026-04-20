"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getAgentStockSummaryAction } from "@/features/lead-generation/actions/get-agent-stock-summary-action";
import type { LeadGenerationAssignableAgent } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents";

import { LeadAssignableAgentSelect } from "./lead-generation-assignable-agent-select";

type Props = {
  agents: LeadGenerationAssignableAgent[];
};

export function AgentStockSummaryPanel({ agents }: Props) {
  const [agentId, setAgentId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    setMessage(null);
    setSummaryText(null);
    if (!agentId) {
      setMessage("Choisissez un collaborateur.");
      return;
    }
    startTransition(async () => {
      const res = await getAgentStockSummaryAction({ agentId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const s = res.data;
      setSummaryText(
        [
          `Fiches attribuées (total historique) : ${s.totalAssigned}`,
          `Stock neuf (pipeline Nouveau — plafond / réinjection) : ${s.totalActive}`,
          `Contacté / En action (pending) : ${s.totalContacted}`,
          `À rappeler (pending) : ${s.totalFollowUp}`,
          `Fiches consommées / traitées : ${s.totalConsumed}`,
          `Converties en fiche prospect : ${s.totalConverted}`,
          `Rejetées : ${s.totalRejected}`,
        ].join("\n"),
      );
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Charge de l’agent</h3>
      <p className="text-xs text-muted-foreground">
        Vue synthétique du stock lead generation pour la personne choisie.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="summary-agent-id">Collaborateur</Label>
          <LeadAssignableAgentSelect
            id="summary-agent-id"
            agents={agents}
            value={agentId}
            onValueChange={setAgentId}
          />
        </div>
        <Button type="button" onClick={load} disabled={pending || !agentId}>
          Afficher le résumé
        </Button>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      {summaryText ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs">{summaryText}</pre>
      ) : null}
    </div>
  );
}
