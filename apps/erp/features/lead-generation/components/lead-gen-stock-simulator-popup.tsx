"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { attachLeadGenerationConversionAction } from "@/features/lead-generation/actions/attach-lead-generation-conversion-action";
import { SimulatorCee } from "@/features/simulator-cee/components/simulator-cee";
import { cn } from "@/lib/utils";

type Props = {
  /** ID de la fiche `lead_generation_stock` à convertir. */
  stockId: string;
  /** Page suivante à ouvrir après conversion. */
  nextStockId: string | null;
  /** Base utilisée pour le paramètre `from` sur la fiche suivante. */
  listHrefForFromParam: string;
  /** Variante visuelle du déclencheur. */
  variant?: "default" | "outline";
  className?: string;
  label?: string;
};

/**
 * Bouton qui ouvre le simulateur CEE en modal pour convertir une fiche
 * lead-generation en lead CRM.
 *
 * Flux :
 *   1. Agent clique → modal s'ouvre avec le simulateur
 *   2. Le simulateur crée un lead CRM (via `submitSimulationAction`)
 *   3. On rattache le `lead.id` au stock-fiche (`converted_lead_id`)
 *      via `attachLeadGenerationConversionAction`
 *   4. On bascule sur la fiche suivante de la file (ou `?queueEmpty=1`)
 */
export function LeadGenStockSimulatorPopup({
  stockId,
  nextStockId,
  listHrefForFromParam,
  variant = "default",
  className,
  label = "Convertir avec le simulateur",
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLeadCreated(leadId: string) {
    // 1. Rattacher le lead à la fiche stock
    const res = await attachLeadGenerationConversionAction({ stockId, leadId });
    if (!res.ok) {
      toast.error("Lead créé mais rattachement échoué", { description: res.error });
      return;
    }

    toast.success("Bravo : fiche convertie en prospect CRM. Passage à la suivante…");
    setOpen(false);

    // 2. Naviguer vers la fiche suivante de la file (ou écran « file vide »)
    if (nextStockId) {
      const p = new URLSearchParams();
      p.set("from", listHrefForFromParam);
      router.push(`/lead-generation/my-queue/${nextStockId}?${p.toString()}`);
    } else {
      router.push("/lead-generation/my-queue?queueEmpty=1");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setOpen(true)}
        className={cn(className)}
      >
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-1/2 top-1/2 h-[90vh] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-violet-100 bg-white px-6 py-4">
            <DialogTitle className="text-violet-950">Convertir en prospect — Simulateur CEE</DialogTitle>
            <DialogDescription>
              Remplissez le parcours pour qualifier le prospect. Le lead sera rattaché à cette fiche
              de prospection à la fin.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <SimulatorCee
              embedded
              onLeadCreated={handleLeadCreated}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
