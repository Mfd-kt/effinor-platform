"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimulatorCee } from "@/features/simulator-cee/components/simulator-cee";
import type { SimulationAnswers } from "@/features/simulator-cee/domain/types";
import { cn } from "@/lib/utils";

type CompleteSimulatorForLeadButtonProps = {
  leadId: string;
  /** Réponses issues du simulateur site — pré-remplissage du parcours. */
  initialAnswers: Partial<SimulationAnswers>;
  variant?: "default" | "outline";
  className?: string;
  label?: string;
};

/**
 * Ouvre le simulateur CEE en modal, pré-rempli avec les réponses collectées
 * sur le site. Le closer termine les questions techniques et l'éligibilité
 * est enregistrée sur le **lead existant** (et non un nouveau lead).
 */
export function CompleteSimulatorForLeadButton({
  leadId,
  initialAnswers,
  variant = "default",
  className,
  label = "Compléter la simulation",
}: CompleteSimulatorForLeadButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSaved() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={cn(className)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-1/2 top-1/2 h-[90vh] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-violet-100 bg-white px-6 py-4">
            <DialogTitle className="text-violet-950">
              Compléter la simulation CEE
            </DialogTitle>
            <DialogDescription>
              Les réponses du simulateur site sont déjà chargées. Complétez les questions
              techniques avec le prospect pour calculer l'éligibilité finale.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <SimulatorCee
              embedded
              initialAnswers={initialAnswers}
              targetLeadId={leadId}
              onLeadCreated={handleSaved}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
