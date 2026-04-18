"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { dispatchLeadGenerationStockForAgentAction } from "@/features/lead-generation/actions/dispatch-lead-generation-stock-for-agent-action";
import type { LeadGenerationAssignableAgent } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents";

import { LeadAssignableAgentSelect } from "./lead-generation-assignable-agent-select";

type Props = {
  agents: LeadGenerationAssignableAgent[];
};

export function DispatchAgentPanel({ agents }: Props) {
  const router = useRouter();
  const [agentId, setAgentId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    setResultText(null);
    if (!agentId) {
      setMessage("Choisissez un collaborateur.");
      return;
    }
    startTransition(async () => {
      const res = await dispatchLeadGenerationStockForAgentAction({ agentId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const d = res.data;
      setResultText(
        [
          `File utilisée : ${d.selectedQueueStatus} (Prêt maintenant).`,
          `Demandé ce tour : ${d.requestedCount} fiche(s)`,
          `Attribué : ${d.assignedCount} fiche(s)`,
          d.remainingNeed > 0 ? `Manquant vs demande : ${d.remainingNeed} fiche(s) (pas assez de lignes éligibles).` : `Manquant vs demande : 0`,
          `Stock actif agent avant → après : ${d.previousStock} → ${d.newStock}`,
        ].join("\n"),
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Distribuer à un collaborateur</h3>
      <p className="text-xs text-muted-foreground">
        Si le stock actif de l’agent est sous le seuil, complète jusqu’à la cible avec des fiches{" "}
        <span className="font-medium text-foreground">Prêt maintenant</span> uniquement (même logique que le dispatch
        multi-agents).
      </p>
      <div className="space-y-2">
        <Label htmlFor="dispatch-one-agent">Collaborateur</Label>
        <LeadAssignableAgentSelect
          id="dispatch-one-agent"
          agents={agents}
          value={agentId}
          onValueChange={setAgentId}
        />
      </div>
      <Button type="button" onClick={run} disabled={pending || !agentId}>
        Distribuer à cet agent
      </Button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      {resultText ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs">{resultText}</pre>
      ) : null}
    </div>
  );
}
