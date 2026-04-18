"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { evaluateLeadGenerationDispatchQueueAction } from "@/features/lead-generation/actions/evaluate-lead-generation-dispatch-queue-action";

type Props = {
  stockId: string;
};

export function LeadGenerationDispatchQueueEvaluateButton({ stockId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await evaluateLeadGenerationDispatchQueueAction({ stockId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const { dispatchQueueStatus, dispatchQueueReason } = res.data;
      setMessage(`Décision : ${dispatchQueueStatus}${dispatchQueueReason ? ` — ${dispatchQueueReason}` : ""}.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={run} disabled={pending}>
        Évaluer la file de dispatch
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
