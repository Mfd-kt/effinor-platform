"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { enrichLeadGenerationStockAction } from "@/features/lead-generation/actions/enrich-lead-generation-stock-action";

type Props = {
  stockId: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function LeadGenerationEnrichStockButton({ stockId, disabled, disabledReason }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await enrichLeadGenerationStockAction({ stockId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      if (res.data.status === "failed" && res.data.error) {
        setMessage(res.data.error);
        return;
      }
      setMessage("Suggestion enregistrée ci-dessous (non vérifiée — à contrôler avant usage).");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="sm" onClick={run} disabled={pending || disabled}>
        Enrichir cette fiche
      </Button>
      {disabled && disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
