"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { LeadGenerationCeeSimulatorModal } from "@/features/lead-generation/components/lead-generation-cee-simulator-modal";
import type { AgentActivityBuckets, AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";
import { cn } from "@/lib/utils";

export type ConvertMyLeadAssignmentCeeBundle = {
  sheets: AgentAvailableSheet[];
  activity: AgentActivityBuckets;
  destratProducts: SimulatorProductCardViewModel[];
};

type Props = {
  stock: LeadGenerationStockRow;
  /** Données poste agent / CEE ; sans fiches actives, l’agent est orienté vers le poste agent. */
  ceeBundle: ConvertMyLeadAssignmentCeeBundle | null;
};

/**
 * Conversion depuis « Ma file » : uniquement via le simulateur CEE (modale).
 */
export function ConvertMyLeadAssignmentButton({ stock, ceeBundle }: Props) {
  const router = useRouter();
  const stockId = stock.id;
  const hasCeeSimulator = Boolean(ceeBundle && ceeBundle.sheets.length > 0);
  const [simOpen, setSimOpen] = useState(false);

  const agentHref = `/agent?lgStock=${encodeURIComponent(stockId)}`;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">Conversion</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {hasCeeSimulator
            ? "La conversion en prospect CRM passe par le simulateur CEE : saisissez la simulation, puis validez ou envoyez au confirmateur. La fiche Lead Gen est clôturée une fois le prospect créé."
            : "La conversion passe obligatoirement par le simulateur CEE. Aucune fiche CEE n’est affectée à votre compte pour l’instant — ouvrez le poste agent (même prospection préremplie) ou contactez votre responsable."}
        </p>
      </div>

      {hasCeeSimulator && ceeBundle ? (
        <>
          <Button type="button" onClick={() => setSimOpen(true)}>
            Convertir avec le simulateur
          </Button>
          <LeadGenerationCeeSimulatorModal
            open={simOpen}
            onOpenChange={setSimOpen}
            stock={stock}
            sheets={ceeBundle.sheets}
            activity={ceeBundle.activity}
            destratProducts={ceeBundle.destratProducts}
            onConversionComplete={() => router.refresh()}
          />
        </>
      ) : (
        <Link
          href={agentHref}
          className={cn(buttonVariants({ variant: "default", size: "default" }), "inline-flex w-fit")}
        >
          Ouvrir le simulateur (poste agent)
        </Link>
      )}

      <p className="text-[11px] text-muted-foreground">
        Besoin de modifier le périmètre ? Utilisez la{" "}
        <Link href="/leads" className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0 align-baseline")}>
          liste des prospects
        </Link>
        .
        {hasCeeSimulator ? (
          <>
            {" "}
            Variante plein écran :{" "}
            <Link href={agentHref} className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0 align-baseline")}>
              poste agent
            </Link>
            .
          </>
        ) : null}
      </p>
    </div>
  );
}
