"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { cleanupOrphanLeadGenerationAssignmentsAction } from "../actions/cleanup-orphan-lead-generation-assignments-action";
import { runLeadGenerationAutomationAction } from "../actions/run-lead-generation-automation-action";
import type { LeadGenerationAutomationType } from "../automation/types";

const ACTIONS: { type: LeadGenerationAutomationType; label: string }[] = [
  { type: "sync_pending_imports", label: "Synchroniser les imports en cours" },
  { type: "score_recent_stock", label: "Scorer les fiches récentes" },
  { type: "evaluate_dispatch_queue_recent_stock", label: "Évaluer la file de dispatch" },
  { type: "evaluate_recycling_active_assignments", label: "Évaluer le recyclage" },
];

export function LeadGenerationControlledAutomationPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [runningType, setRunningType] = useState<LeadGenerationAutomationType | null>(null);

  function run(type: LeadGenerationAutomationType) {
    setMessage(null);
    setRunningType(type);
    startTransition(async () => {
      const res = await runLeadGenerationAutomationAction({ automationType: type });
      setRunningType(null);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const { status, summary, errorSummary, id } = res.data;
      const lines = [
        `Run ${id.slice(0, 8)}… — ${status === "completed" ? "terminé" : "échec"}.`,
        status === "failed" && errorSummary ? `Erreur : ${errorSummary}` : null,
        `Résumé : ${JSON.stringify(summary, null, 2)}`,
      ].filter(Boolean);
      setMessage(lines.join("\n\n"));
      router.refresh();
    });
  }

  function runOrphanCleanup() {
    setMessage(null);
    setRunningType(null);
    startTransition(async () => {
      const res = await cleanupOrphanLeadGenerationAssignmentsAction({ limit: 200 });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage(
        `Nettoyage terminé.\n\nScannées: ${res.data.scanned}\nAssignations recyclées: ${res.data.recycledAssignments}\nFiches remises en ready: ${res.data.resetStocks}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">
        Lots bornés (pas de conversion ni de dispatch automatiques). Chaque exécution est journalisée.
      </p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.type}
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(a.type)}
          >
            {pending && runningType === a.type ? (
              <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            {a.label}
          </Button>
        ))}
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={runOrphanCleanup}>
          Nettoyer les assignations orphelines
        </Button>
      </div>
      {message ? (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-foreground">
          {message}
        </pre>
      ) : null}
    </div>
  );
}
