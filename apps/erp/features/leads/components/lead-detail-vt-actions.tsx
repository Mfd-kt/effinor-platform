"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createTechnicalVisitFromLead } from "@/features/leads/actions/create-technical-visit-from-lead";
import type { TechnicalVisitRef } from "@/features/leads/queries/get-technical-visits-for-lead";
import { Button } from "@/components/ui/button";

type LeadDetailVtActionsProps = {
  leadId: string;
  /** Adresses siège + travaux complètes. */
  addressesComplete: boolean;
  companyNameOk: boolean;
  /** Lead `lost` ou `converted`. */
  pipelineBlocked: boolean;
  /** VT active existante → pas de nouvelle création silencieuse. */
  activeVisit: TechnicalVisitRef | null;
  /** Toutes les VT du lead (affichage). */
  allVisits: TechnicalVisitRef[];
  /** Agent en lecture seule après envoi au confirmateur. */
  consultationReadOnly?: boolean;
};

export function LeadDetailVtActions({
  leadId,
  addressesComplete,
  companyNameOk,
  pipelineBlocked,
  activeVisit,
  allVisits,
  consultationReadOnly = false,
}: LeadDetailVtActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [errorVisitId, setErrorVisitId] = useState<string | null>(null);

  const canCreate =
    !consultationReadOnly &&
    !pipelineBlocked &&
    !activeVisit &&
    addressesComplete &&
    companyNameOk;

  function handleCreateVt() {
    setError(null);
    setErrorVisitId(null);
    startTransition(async () => {
      const result = await createTechnicalVisitFromLead(leadId);
      if (result.ok) {
        router.push(`/technical-visits/${result.technicalVisitId}`);
        router.refresh();
        return;
      }
      setErrorVisitId(result.existingTechnicalVisitId ?? null);
      setError(result.message);
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
            Une seule visite en cours à la fois sur ce dossier. Après un refus ou une annulation, vous
            pourrez en créer une nouvelle. Si aucun confirmateur n’est encore indiqué sur le lead, votre
            compte sera utilisé lors de la création.
          </p>

          {consultationReadOnly ? (
            <p className="text-sm text-muted-foreground">
              En consultation agent (dossier transmis au confirmateur), la création de visite technique n’est pas
              disponible depuis cette fiche.
            </p>
          ) : null}

          {pipelineBlocked ? (
            <p className="text-amber-700 text-sm dark:text-amber-500">
              Ce lead est en statut terminal : la création de visite technique n’est plus proposée.
            </p>
          ) : null}

          {activeVisit ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">
                Une visite technique existe déjà pour ce lead (statut actif).
              </p>
              <p className="mt-1 text-muted-foreground">
                Réf.{" "}
                <Link
                  href={`/technical-visits/${activeVisit.id}`}
                  className="font-mono font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {activeVisit.vt_reference}
                </Link>
              </p>
            </div>
          ) : null}

          {!activeVisit && !pipelineBlocked && !consultationReadOnly ? (
            <ul className="text-muted-foreground text-xs space-y-1">
              {!addressesComplete ? (
                <li>Compléter les adresses siège et travaux (6 champs).</li>
              ) : null}
              {!companyNameOk ? <li>Renseigner le nom de la société.</li> : null}
            </ul>
          ) : null}

          {error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <p>{error}</p>
              {errorVisitId ? (
                <Link
                  href={`/technical-visits/${errorVisitId}`}
                  className="mt-2 inline-block font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Ouvrir la visite technique
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {allVisits.length > 0 ? (
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Visites liées à ce lead</p>
              <ul className="mt-1 space-y-1">
                {allVisits.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/technical-visits/${v.id}`}
                      className="font-mono text-foreground text-sm underline-offset-4 hover:underline"
                    >
                      {v.vt_reference}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!activeVisit && !pipelineBlocked && !consultationReadOnly ? (
            <Button
              type="button"
              size="lg"
              disabled={!canCreate || isPending}
              onClick={handleCreateVt}
            >
              {isPending ? "Création…" : "Créer une visite technique"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
