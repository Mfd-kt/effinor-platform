"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { identifyLeadGenerationDecisionMakerAction } from "../actions/identify-lead-generation-decision-maker-action";

type Props = {
  stockId: string;
};

/**
 * Enrichissement décideur B2B : extraction depuis pages publiques et résultats de recherche (Firecrawl).
 * Aucune donnée inventée — uniquement du texte réellement présent dans les sources.
 */
export function LeadGenerationIdentifyDecisionMakerButton({ stockId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setMessage(null);
    startTransition(async () => {
      const res = await identifyLeadGenerationDecisionMakerAction({ stockId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      if (res.data.skipped) {
        setMessage("Aucune mise à jour : champs déjà renseignés ou rien à compléter.");
      } else {
        const parts: string[] = [];
        if (res.data.decision_maker_name) parts.push(`Nom : ${res.data.decision_maker_name}`);
        if (res.data.decision_maker_role) parts.push(`Rôle : ${res.data.decision_maker_role}`);
        if (res.data.decision_maker_source) {
          parts.push(`Source : ${res.data.decision_maker_source} (${res.data.decision_maker_confidence ?? "—"})`);
        }
        setMessage(parts.length > 0 ? parts.join(" · ") : "Enregistré.");
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium text-foreground">Décideur (extraction publique)</p>
      <p className="text-[11px] text-muted-foreground">
        Parcourt le site (équipe, contact), puis recherche web et sources publiques. Ne remplit que les champs encore
        vides — jamais de nom inventé.
      </p>
      <Button type="button" variant="secondary" size="sm" onClick={run} disabled={pending}>
        {pending ? "Analyse…" : "Identifier le décideur"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
