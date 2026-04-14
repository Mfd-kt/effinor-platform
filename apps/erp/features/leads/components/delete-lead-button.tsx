"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { deleteLead } from "@/features/leads/actions/delete-lead";

type DeleteLeadButtonProps = {
  leadId: string;
  companyLabel: string;
};

export function DeleteLeadButton({ leadId, companyLabel }: DeleteLeadButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    const ok = window.confirm(
      `Supprimer définitivement le lead « ${companyLabel} » ? Cette action est réservée au super administrateur.`,
    );
    if (!ok) return;

    setError(null);
    setPending(true);
    const result = await deleteLead(leadId);
    setPending(false);
    if (result.ok) {
      router.push("/leads");
      router.refresh();
      return;
    }
    setError(result.message);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="destructive" disabled={pending} onClick={() => void onClick()}>
        {pending ? "Suppression…" : "Supprimer le lead"}
      </Button>
      {error ? <p className="max-w-xs text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
