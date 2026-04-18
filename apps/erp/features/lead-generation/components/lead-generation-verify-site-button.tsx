"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { enrichLeadGenerationStockVerifiedAction } from "@/features/lead-generation/actions/enrich-lead-generation-stock-verified-action";

type Props = {
  stockId: string;
  disabled?: boolean;
  disabledReason?: string;
};

/**
 * Étape 11 — vérification via Firecrawl (distinct de l’enrichissement heuristique).
 */
export function LeadGenerationVerifySiteButton({ stockId, disabled, disabledReason }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await enrichLeadGenerationStockVerifiedAction({ stockId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      if (res.data.status === "failed" && res.data.error) {
        setMessage(res.data.error);
        return;
      }
      const conf = res.data.enrichment_confidence;
      setMessage(
        conf === "high"
          ? "Vérification terminée : email public identifié sur le site."
          : conf === "medium"
            ? "Vérification terminée : domaine confirmé sur le site public (sans email public repéré)."
            : "Vérification enregistrée.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-primary/25 bg-primary/5 p-3">
      <p className="text-xs font-medium text-foreground">Vérification sur le site public (Firecrawl)</p>
      <p className="text-[11px] text-muted-foreground">
        Lecture ciblée de 1 à 3 pages max. Aucun email inventé — uniquement ce qui apparaît sur le site.
      </p>
      <Button type="button" variant="default" size="sm" className="bg-primary" onClick={run} disabled={pending || disabled}>
        Vérifier via le site
      </Button>
      {disabled && disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
