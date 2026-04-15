"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type MouseEvent } from "react";
import { toast } from "sonner";

import { softDeleteTechnicalVisitAdminAction } from "@/features/technical-visits/actions/soft-delete-technical-visit-admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  visitId: string;
  vtReference: string;
  /** Après succès : ex. `/technical-visits` depuis la fiche détail. */
  redirectAfterDelete?: string;
  /** Pour la ligne du tableau : empêcher la navigation vers la fiche. */
  stopRowNavigation?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg";
};

export function TechnicalVisitAdminDeleteButton({
  visitId,
  vtReference,
  redirectAfterDelete,
  stopRowNavigation = false,
  className,
  size = "sm",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick(e: MouseEvent<HTMLButtonElement>) {
    if (stopRowNavigation) {
      e.stopPropagation();
      e.preventDefault();
    }
    const confirmed = window.confirm(
      `Supprimer la visite « ${vtReference} » ?\n\nLa fiche sera archivée (soft delete) et disparaîtra des listes ; les données restent en base pour l’audit.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await softDeleteTechnicalVisitAdminAction(visitId);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Visite archivée.");
      if (redirectAfterDelete) {
        router.push(redirectAfterDelete);
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={pending}
      className={cn(
        "gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10",
        className,
      )}
      onClick={onClick}
      aria-label={`Archiver la visite ${vtReference}`}
    >
      <Trash2 className="size-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{pending ? "…" : "Archiver"}</span>
    </Button>
  );
}
