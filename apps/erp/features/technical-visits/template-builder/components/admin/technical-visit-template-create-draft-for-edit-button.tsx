"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createTechnicalVisitTemplateNextDraftVersion } from "@/features/technical-visits/template-builder/actions/template-builder-actions";

/**
 * Sur une version publiée (lecture seule) : crée un brouillon à partir de la **dernière**
 * version publiée du même template (même clé métier), puis ouvre l’éditeur.
 * Ne crée pas une nouvelle fiche template : la fiche CEE peut rester sur la même clé
 * et passer à la nouvelle version après publication.
 */
export function TechnicalVisitTemplateCreateDraftForEditButton({
  templateId,
  disabled,
  disabledReason,
}: {
  templateId: string;
  disabled: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const r = await createTechnicalVisitTemplateNextDraftVersion(templateId);
      if (!r.ok || !r.data) {
        alert(r.ok ? "Erreur inattendue." : r.message);
        return;
      }
      router.push(`/admin/technical-visit-templates/${templateId}/versions/${r.data.versionId}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" onClick={onClick} disabled={disabled || pending}>
        {pending ? "Préparation…" : "Modifier le formulaire (nouveau brouillon)"}
      </Button>
      {disabled && disabledReason ? (
        <p className="text-muted-foreground text-xs">{disabledReason}</p>
      ) : null}
    </div>
  );
}
