"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { autoDispatchPremiumLeadsAction } from "../actions/auto-dispatch-premium-leads-action";
import { identifyPremiumLeadGenerationDecisionMakersBatchAction } from "../actions/identify-premium-lead-generation-decision-makers-batch-action";
import { recalculatePremiumReadyStockQuickAction } from "../actions/recalculate-premium-ready-stock-quick-action";
import { humanizeLeadGenerationActionError } from "../lib/humanize-lead-generation-action-error";

export function LeadGenerationPremiumPanel() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [identifyLine, setIdentifyLine] = useState<string | null>(null);
  const [scoreLine, setScoreLine] = useState<string | null>(null);
  const [dispatchLine, setDispatchLine] = useState<string | null>(null);

  return (
    <Card className="border-border/80 bg-gradient-to-br from-violet-500/[0.04] to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-300" aria-hidden />
          <CardTitle className="text-base">Leads premium</CardTitle>
        </div>
        <CardDescription>
          Lot ciblé : décideurs sur les meilleures fiches, scoring distinct, distribution séparée du flux standard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await identifyPremiumLeadGenerationDecisionMakersBatchAction({});
                if (!res.ok) {
                  setError(humanizeLeadGenerationActionError(res.error));
                  return;
                }
                const d = res.data;
                setIdentifyLine(
                  `Décideurs : ${d.totalProcessed} traitée(s) · ${d.totalIdentified} identifiée(s) · ${d.totalSkipped} ignorée(s) · ${d.failedStockIds.length} échec(s).`,
                );
              });
            }}
          >
            Identifier les décideurs premium
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await recalculatePremiumReadyStockQuickAction({});
                if (!res.ok) {
                  setError(humanizeLeadGenerationActionError(res.error));
                  return;
                }
                const d = res.data;
                setScoreLine(
                  `Scoring : ${d.totalScored} fiche(s) recalculée(s) sur ${d.totalRequested} ciblée(s)${
                    d.totalFailed ? ` · ${d.totalFailed} erreur(s)` : ""
                  }.`,
                );
              });
            }}
          >
            Scorer les leads premium
          </Button>
          <Button
            type="button"
            size="sm"
            variant="default"
            className="bg-violet-600 text-white hover:bg-violet-600/90 dark:bg-violet-700 dark:hover:bg-violet-700/90"
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await autoDispatchPremiumLeadsAction({});
                if (!res.ok) {
                  setError(humanizeLeadGenerationActionError(res.error));
                  return;
                }
                const d = res.data;
                const dist = Object.entries(d.distributionByAgent)
                  .map(([name, n]) => `${name} : ${n}`)
                  .join(" · ");
                setDispatchLine(
                  `Distribution : ${d.totalAssigned} attribuée(s) · ${d.remainingPremiumLeads} premium restant(s)${dist ? ` · ${dist}` : ""}.`,
                );
              });
            }}
          >
            Distribuer les leads premium
          </Button>
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <ul className="space-y-1 text-xs text-muted-foreground">
          {identifyLine ? <li>{identifyLine}</li> : null}
          {scoreLine ? <li>{scoreLine}</li> : null}
          {dispatchLine ? <li>{dispatchLine}</li> : null}
        </ul>
      </CardContent>
    </Card>
  );
}
