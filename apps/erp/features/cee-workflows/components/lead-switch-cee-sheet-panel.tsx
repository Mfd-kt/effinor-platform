"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { switchLeadToCeeSheetWorkflow } from "@/features/cee-workflows/actions/workflow-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type CeeSheetSwitchOption = { id: string; code: string; name: string };

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type Props = {
  leadId: string;
  currentCeeSheetId: string | null;
  sheetOptions: CeeSheetSwitchOption[];
  readOnly: boolean;
};

export function LeadSwitchCeeSheetPanel({
  leadId,
  currentCeeSheetId,
  sheetOptions,
  readOnly,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [pending, startTransition] = useTransition();

  const choices = sheetOptions.filter((s) => s.id !== currentCeeSheetId);

  if (readOnly || choices.length === 0) {
    return null;
  }

  function runSwitch() {
    if (!selectedId) {
      toast.error("Choisissez une fiche CEE.");
      return;
    }
    startTransition(async () => {
      const res = await switchLeadToCeeSheetWorkflow({
        leadId,
        newCeeSheetId: selectedId,
        copyRoleAssignments: true,
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(
        "Fiche CEE changée : le même dossier est conservé (notes, e-mails, simulateur sur la fiche). Le tunnel de l’ancienne fiche est supprimé ; simulation, qualification et pièces du flux précédent sont repris sur la nouvelle fiche.",
      );
      setOpen(false);
      setSelectedId("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
          Changer de fiche CEE (workflow complet)
        </p>
        <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90">
          Réservé aux profils habilités (super admin, confirmateur, closer, manager d’équipe CEE sur la fiche du
          dossier). Le dossier reste le même (pas de doublon de lead) : notes, e-mails et données simulateur sur la
          fiche sont conservés ; le tunnel de l’ancienne fiche est supprimé et un flux sur la nouvelle fiche reprend
          simulation, qualification et documents du flux précédent dans la mesure du possible.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 border-amber-300 bg-background"
          onClick={() => setOpen(true)}
        >
          Changer de fiche CEE…
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le changement de fiche CEE</DialogTitle>
            <DialogDescription>
              Le même lead est conservé (une seule fiche client en base). Les workflows liés à l’ancienne fiche CEE
              seront supprimés pour éviter les doublons de tunnel. Un workflow sur la nouvelle fiche reprend les
              données du flux en cours (simulateur, qualification, pièces, statut) ; les affectations agent /
              confirmateur / closer seront reprises si possible. La catégorie commerciale du lead sera alignée sur la
              nouvelle fiche.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="switch-cee-sheet">Nouvelle fiche CEE</Label>
            <select
              id="switch-cee-sheet"
              className={selectClassName}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— Choisir —</option>
              {choices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" disabled={!selectedId || pending} onClick={runSwitch}>
              {pending ? "En cours…" : "Confirmer le changement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
