"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteLeadGenerationStockAction } from "@/features/lead-generation/actions/delete-lead-generation-stock-action";
import { humanizeLeadGenerationActionError } from "@/features/lead-generation/lib/humanize-lead-generation-action-error";

type Props = {
  stockId: string;
  companyName: string;
  convertedLeadId: string | null;
  stockStatus: string;
};

export function LeadGenerationDeleteStockButton({
  stockId,
  companyName,
  convertedLeadId,
  stockStatus,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blocked = Boolean(convertedLeadId) || stockStatus === "converted";

  function onClick() {
    if (blocked) return;
    const label = companyName.trim() || "cette fiche";
    const ok = window.confirm(
      `Supprimer définitivement « ${label} » de la base ? Les assignations et l’historique associés seront supprimés. Cette action ne peut pas être annulée.`,
    );
    if (!ok) return;

    setMessage(null);
    startTransition(async () => {
      const res = await deleteLeadGenerationStockAction({ stockId });
      if (!res.ok) {
        setMessage(humanizeLeadGenerationActionError(res.error));
        return;
      }
      router.push("/lead-generation/stock");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending || blocked}
        title={
          blocked
            ? "Fiche convertie ou liée au CRM : supprimez ou déliez le prospect d’abord."
            : undefined
        }
        onClick={() => void onClick()}
      >
        {pending ? "Suppression…" : "Supprimer la fiche"}
      </Button>
      {message ? <p className="max-w-xs text-right text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
