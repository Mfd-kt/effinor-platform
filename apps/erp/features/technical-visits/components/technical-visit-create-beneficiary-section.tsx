"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createBeneficiaryFromTechnicalVisit } from "@/features/technical-visits/actions/create-beneficiary-from-technical-visit";

type TechnicalVisitCreateBeneficiarySectionProps = {
  technicalVisitId: string;
  beneficiaryId: string | null;
  beneficiaryCompanyName: string | null;
};

export function TechnicalVisitCreateBeneficiarySection({
  technicalVisitId,
  beneficiaryId,
  beneficiaryCompanyName,
}: TechnicalVisitCreateBeneficiarySectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [linkBeneficiaryId, setLinkBeneficiaryId] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    setLinkBeneficiaryId(null);
    startTransition(async () => {
      const result = await createBeneficiaryFromTechnicalVisit(technicalVisitId);
      if (result.ok) {
        router.push(`/beneficiaries/${result.beneficiaryId}`);
        router.refresh();
        return;
      }
      if (result.existingBeneficiaryId) {
        setLinkBeneficiaryId(result.existingBeneficiaryId);
      }
      setError(result.message);
    });
  }

  if (beneficiaryId) {
    return (
      <div className="mb-8 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Bénéficiaire lié</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Cette visite est associée à{" "}
          <span className="font-medium text-foreground">
            {beneficiaryCompanyName ?? "un bénéficiaire"}
          </span>
          .
        </p>
        <Link
          href={`/beneficiaries/${beneficiaryId}`}
          className="mt-3 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Ouvrir la fiche bénéficiaire
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Créer le bénéficiaire</h2>
          <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
            Génère un bénéficiaire à partir du lead et de cette visite, sans resaisie. La visite sera
            automatiquement liée au dossier créé.
          </p>

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <p>{error}</p>
              {linkBeneficiaryId ? (
                <Link
                  href={`/beneficiaries/${linkBeneficiaryId}`}
                  className="mt-2 inline-block font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Ouvrir le bénéficiaire existant
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Button type="button" size="lg" disabled={isPending} onClick={handleCreate}>
            {isPending ? "Création…" : "Créer le bénéficiaire"}
          </Button>
        </div>
      </div>
    </div>
  );
}
