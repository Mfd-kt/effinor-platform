"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { dispatchLeadGenerationStockForAgentsAction } from "@/features/lead-generation/actions/dispatch-lead-generation-stock-for-agents-action";
import type { LeadGenerationAssignableAgent } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents";
import { cn } from "@/lib/utils";

type Props = {
  agents: LeadGenerationAssignableAgent[];
};

export function DispatchAgentsPanel({ agents }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run() {
    setMessage(null);
    setResultText(null);
    const agentIds = [...selected];
    if (agentIds.length === 0) {
      setMessage("Cochez au moins un collaborateur.");
      return;
    }
    startTransition(async () => {
      const res = await dispatchLeadGenerationStockForAgentsAction({ agentIds });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const lines = res.data.agents.map((a) => {
        const label = agents.find((x) => x.id === a.agentId);
        const name = label ? `${label.displayName}${label.email ? ` (${label.email})` : ""}` : a.agentId;
        const miss =
          a.remainingNeed > 0
            ? `, manquant ${a.remainingNeed} vs demande`
            : "";
        return [
          `${name}`,
          `  file ${a.selectedQueueStatus} — demandé : ${a.requestedCount}, attribué : ${a.assignedCount}${miss}`,
          `  stock actif avant → après : ${a.previousStock} → ${a.newStock}`,
        ].join("\n");
      });
      setResultText(lines.join("\n\n"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Distribuer à plusieurs collaborateurs</h3>
      <p className="text-xs text-muted-foreground">
        Un passage par personne cochée. Chaque agent est rechargé uniquement avec des fiches{" "}
        <span className="font-medium text-foreground">Prêt maintenant</span> (file{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[11px]">ready_now</code>), sans basculer vers d’autres
        décisions de file.
      </p>
      <div className="space-y-2">
        <Label>Collaborateurs</Label>
        <div className="max-h-48 overflow-y-auto rounded-md border border-border p-3">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun profil disponible.</p>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-3 border-b border-border pb-2 pl-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Collaborateur</span>
                <span className="w-14 shrink-0 text-right tabular-nums sm:w-16">Stock actif</span>
              </div>
              {agents.map((a) => {
                const stock = a.activeStock ?? 0;
                return (
                  <label
                    key={a.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{a.displayName}</span>
                      {a.email ? <span className="text-muted-foreground"> · {a.email}</span> : null}
                    </span>
                    <span
                      className="w-14 shrink-0 text-right tabular-nums font-medium text-foreground sm:w-16"
                      title="Fiches en cours (attribuées / ouvertes / en traitement, en attente d’issue)"
                    >
                      {stock}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Button type="button" onClick={run} disabled={pending || selected.size === 0}>
        Distribuer aux agents sélectionnés
      </Button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      {resultText ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs">{resultText}</pre>
      ) : null}
    </div>
  );
}
