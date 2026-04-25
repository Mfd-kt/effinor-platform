"use client";

import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { LeadGenStockSimulatorPopup } from "@/features/lead-generation/components/lead-gen-stock-simulator-popup";

/**
 * @deprecated Conservé pour compatibilité — la prop `ceeBundle` n'est plus utilisée.
 * Le bouton de conversion ouvre directement le nouveau simulateur CEE en modal.
 */
export type ConvertMyLeadAssignmentCeeBundle = {
  sheets: unknown[];
  activity: unknown;
  destratProducts: unknown[];
};

type Props = {
  stock: LeadGenerationStockRow;
  /** Bundle CEE legacy — ignoré ; conservé pour compatibilité de signature. */
  ceeBundle?: ConvertMyLeadAssignmentCeeBundle | null;
  /**
   * Navigation post-conversion : ordre des fiches de la file de l'agent.
   */
  myQueuePostConversion?: {
    nextStockId: string | null;
    /** Base pour le paramètre `from` sur la fiche suivante. */
    listHrefForFromParam: string;
  };
};

/**
 * Conversion depuis « Ma file » : ouvre le simulateur CEE en modal.
 * Au succès, le lead créé est rattaché à la fiche stock (`converted_lead_id`)
 * et l'agent est dirigé vers la fiche suivante.
 */
export function ConvertMyLeadAssignmentButton({ stock, myQueuePostConversion }: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">Conversion en prospect CRM</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ouvrez le simulateur CEE pour qualifier le prospect. Le lead créé sera automatiquement
          rattaché à cette fiche de prospection.
        </p>
      </div>

      <LeadGenStockSimulatorPopup
        stockId={stock.id}
        nextStockId={myQueuePostConversion?.nextStockId ?? null}
        listHrefForFromParam={
          myQueuePostConversion?.listHrefForFromParam ?? "/lead-generation/my-queue"
        }
        label="Ouvrir le simulateur"
      />
    </div>
  );
}
