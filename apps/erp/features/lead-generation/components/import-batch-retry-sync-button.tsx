"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { retryLeadGenerationImportSyncAction } from "../actions/retry-lead-generation-import-sync-action";
import type { LeadGenerationImportSyncRetryEligibility } from "../lib/lead-generation-import-sync-retry-eligibility";

type Props = {
  batchId: string;
  eligibility: LeadGenerationImportSyncRetryEligibility;
};

export function ImportBatchRetrySyncButton({ batchId, eligibility }: Props) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!eligibility.retryable) return;
    setFeedback(null);
    startTransition(async () => {
      setFeedback("Tentative de récupération des résultats Apify…");
      const res = await retryLeadGenerationImportSyncAction({ batchId });
      if (!res.ok) {
        setFeedback(res.error);
        return;
      }
      setFeedback(res.data.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={run}
        disabled={pending || !eligibility.retryable}
      >
        {pending ? "Relance en cours…" : "Retenter la synchro"}
      </Button>
      {!eligibility.retryable ? (
        <p className="text-xs text-muted-foreground">{eligibility.userMessage}</p>
      ) : null}
      {feedback ? <p className="text-xs leading-relaxed text-foreground">{feedback}</p> : null}
    </div>
  );
}
