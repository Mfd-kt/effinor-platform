"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { evaluateActiveLeadGenerationAssignmentRecycleStatusQuickAction } from "@/features/lead-generation/actions/evaluate-active-lead-generation-assignment-recycle-status-quick-action";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";
import type { EvaluateRecycleBatchSummary } from "@/features/lead-generation/recycling/evaluate-recycle-status";

function formatBatch(s: EvaluateRecycleBatchSummary): string {
  if (s.totalRequested === 0) {
    return "Aucune assignation active à analyser.";
  }
  if (s.totalFailed === 0) {
    return `${s.totalSucceeded} assignation${s.totalSucceeded > 1 ? "s" : ""} analysée${s.totalSucceeded > 1 ? "s" : ""}.`;
  }
  if (s.totalSucceeded === 0) {
    return `Aucune analyse réussie, ${s.totalFailed} erreur(s).`;
  }
  return `${s.totalSucceeded} analysée(s), ${s.totalFailed} erreur(s).`;
}

export function LeadGenerationRecycleToolbar() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await evaluateActiveLeadGenerationAssignmentRecycleStatusQuickAction({});
      if (!res.ok) {
        setMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      setMessage(formatBatch(res.data));
      if (res.data.totalRequested > 0) {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Repère les attributions actives sans activité récente pour réintégrer ou recycler les fiches.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-border/80 bg-transparent font-medium"
          onClick={run}
          disabled={pending}
        >
          Vérifier les leads inactifs
        </Button>
      </div>
      {message ? (
        <p className="mt-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
          {message}
        </p>
      ) : null}
    </div>
  );
}
