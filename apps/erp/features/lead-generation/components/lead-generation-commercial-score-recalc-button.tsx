"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { recalculateLeadGenerationCommercialScoreAction } from "@/features/lead-generation/actions/recalculate-lead-generation-commercial-score-action";

type Props = {
  stockId: string;
};

export function LeadGenerationCommercialScoreRecalcButton({ stockId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await recalculateLeadGenerationCommercialScoreAction({ stockId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage(`Score mis à jour : ${res.data.score} points (priorité ${res.data.priority}).`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={run} disabled={pending}>
        Recalculer le score commercial
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
