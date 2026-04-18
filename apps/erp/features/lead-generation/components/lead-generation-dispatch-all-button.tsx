"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { autoDispatchAllLeadsAction } from "@/features/lead-generation/actions/auto-dispatch-leads-action";
import type { GetLeadGenerationStockFilters } from "@/features/lead-generation/queries/get-lead-generation-stock";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";

type Props = {
  /** Fiches réellement attribuables (intersection ready_now + filtres). */
  readyPoolCount: number;
  /** Même périmètre que la liste (ville, lot, contact_gap…). */
  dispatchFilters?: GetLeadGenerationStockFilters;
};

export function LeadGenerationDispatchAllButton({ readyPoolCount, dispatchFilters }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await autoDispatchAllLeadsAction(
        dispatchFilters && Object.keys(dispatchFilters).length > 0 ? { filters: dispatchFilters } : {},
      );
      if (!res.ok) {
        setMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      const d = res.data;
      const parts = [
        `${d.total_assigned} attribution${d.total_assigned > 1 ? "s" : ""}`,
        d.rounds != null && d.rounds > 1 ? `(${d.rounds} passes)` : null,
        Object.keys(d.distribution_par_agent).length
          ? `— ${Object.entries(d.distribution_par_agent)
              .map(([a, n]) => `${a}: ${n}`)
              .join(", ")}`
          : null,
        `— reste ${d.remaining_leads} dans le périmètre`,
      ].filter(Boolean);
      setMessage(parts.join(" "));
      router.refresh();
    });
  }

  const hasScope = dispatchFilters && Object.keys(dispatchFilters).length > 0;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={pending || readyPoolCount === 0}
        onClick={run}
        title={
          readyPoolCount === 0
            ? hasScope
              ? "Aucune fiche « prêt maintenant » dans ce périmètre (ajustez les filtres)."
              : "Aucune fiche prête (file ready_now + critères RPC)."
            : "Au plus 100 attributions par clic — relancez pour vider la suite du périmètre."
        }
      >
        {pending ? "Distribution…" : `Distribuer tout (${readyPoolCount})`}
      </Button>
      {message ? <p className="text-xs text-muted-foreground whitespace-pre-wrap">{message}</p> : null}
    </div>
  );
}
