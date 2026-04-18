"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import { identifyClosingLeadGenerationDecisionMakersBatchAction } from "../actions/identify-closing-decision-makers-batch-action";
import { recalculateClosingReadyStockQuickAction } from "../actions/recalculate-closing-ready-stock-quick-action";
import type { LeadGenerationClosingCockpitMetrics } from "../queries/get-lead-generation-closing-cockpit-metrics";

type Props = {
  metrics: LeadGenerationClosingCockpitMetrics;
};

export function LeadGenerationClosingCockpitPanel({ metrics }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">Leads prêts pour le closing</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Décideurs, profil LinkedIn ciblé et score closing — pour nourrir les campagnes à fort taux de conversion.
      </p>

      <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <li>
          <span className="text-muted-foreground">Closing fort :</span>{" "}
          <span className="font-semibold tabular-nums text-foreground">{metrics.closingHighCount}</span>
        </li>
        <li>
          <span className="text-muted-foreground">Avec décideur identifié :</span>{" "}
          <span className="font-semibold tabular-nums text-foreground">{metrics.withDecisionMakerCount}</span>
        </li>
        <li>
          <span className="text-muted-foreground">Avec LinkedIn :</span>{" "}
          <span className="font-semibold tabular-nums text-foreground">{metrics.withLinkedInCount}</span>
        </li>
        <li>
          <span className="text-muted-foreground">Premium (actifs) :</span>{" "}
          <span className="font-semibold tabular-nums text-foreground">{metrics.premiumReadyCount}</span>
        </li>
      </ul>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const r = await identifyClosingLeadGenerationDecisionMakersBatchAction({ limit: 35 });
              if (!r.ok) window.alert(r.error);
              router.refresh();
            });
          }}
        >
          Identifier les décideurs
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const r = await recalculateClosingReadyStockQuickAction({ limit: 100 });
              if (!r.ok) window.alert(r.error);
              router.refresh();
            });
          }}
        >
          Scorer le closing
        </Button>
        <Link
          href="/lead-generation/stock?closing_readiness_status=high"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-foreground")}
        >
          Voir les leads closing-ready
        </Link>
      </div>
    </section>
  );
}
