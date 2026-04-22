"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { syncLeboncoinImmobilierImportAction } from "@/features/lead-generation/actions/sync-leboncoin-immobilier-import-action";

type Props = {
  batchId: string;
  /** Taille du bouton. Default = "sm". */
  size?: "sm" | "default";
  /** Variante visuelle. Default = "outline". */
  variant?: "outline" | "ghost" | "default";
};

/**
 * Bouton "Actualiser" pour un batch Apify en cours.
 * Appelle la Server Action de sync, affiche un toast avec le résultat.
 * La page se rafraîchit automatiquement via revalidatePath dans l'action.
 */
export function SyncLeboncoinImportButton({ batchId, size = "sm", variant = "outline" }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await syncLeboncoinImmobilierImportAction({ batchId });

      if (!result.ok) {
        toast.error("Erreur de synchronisation", {
          description: result.error,
        });
        return;
      }

      if (result.status === "running") {
        toast.info("Scraping en cours", {
          description: "Le run Apify n'est pas encore terminé. Réessayez dans 1-2 minutes.",
        });
        return;
      }

      if (result.status === "failed") {
        toast.error("Import échoué", {
          description: "Le run Apify a échoué. Consultez les logs pour plus de détails.",
        });
        return;
      }

      if (result.insertedCount === 0 && result.duplicateCount === 0) {
        toast.warning("Import terminé — 0 annonce récupérée", {
          description: "Le scraping n'a retourné aucun résultat. Vérifiez les filtres.",
        });
        return;
      }

      let description = `${result.insertedCount} fiches ajoutées au stock`;
      if (result.duplicateCount > 0) {
        description += ` (${result.duplicateCount} doublons ignorés)`;
      }
      if (result.phoneQuotaExhausted) {
        description += " — quota téléphone Apify atteint";
      }

      toast.success("Import synchronisé !", { description });
    });
  }

  return (
    <Button size={size} variant={variant} onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      Actualiser
    </Button>
  );
}
