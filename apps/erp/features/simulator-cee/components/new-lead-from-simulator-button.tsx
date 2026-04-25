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
import { cn } from "@/lib/utils";

type NewLeadFromSimulatorButtonProps = {
  /** Variante visuelle du déclencheur. */
  variant?: "default" | "outline";
  className?: string;
  label?: string;
};

/**
 * Déclenche l’ouverture du simulateur CEE en modal.
 * Utilisé en lieu et place de `<Link href="/leads/new">` pour forcer
 * la création de lead via le simulateur (parcours commercial homogène).
 */
export function NewLeadFromSimulatorButton({
  variant = "default",
  className,
  label = "Nouveau lead",
}: NewLeadFromSimulatorButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleLeadCreated(leadId: string) {
    setOpen(false);
    router.push(`/leads/${leadId}`);
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)} className={cn(className)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-1/2 top-1/2 h-[90vh] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-violet-100 bg-white px-6 py-4">
            <DialogTitle className="text-violet-950">Nouveau lead — Simulateur CEE</DialogTitle>
            <DialogDescription>
              Remplissez le parcours pour qualifier le prospect et créer le lead automatiquement.
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
