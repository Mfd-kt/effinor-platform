"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { createTechnicalVisitFromWorkflow } from "@/features/technical-visits/actions/create-technical-visit-from-workflow";
import { cn } from "@/lib/utils";

export function WorkflowTechnicalVisitCta({
  workflowId,
  activeTechnicalVisitId,
  visitTemplateAvailable,
  workflowStatusAllowsTechnicalVisit,
  createBlocked,
  createBlockedReason,
}: {
  workflowId: string;
  activeTechnicalVisitId: string | null;
  visitTemplateAvailable: boolean;
  workflowStatusAllowsTechnicalVisit: boolean;
  createBlocked: boolean;
  createBlockedReason?: string | null;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ type: "err"; text: string } | null>(null);
  const [postCreate, setPostCreate] = useState<{ visitId: string; warnings: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showCreate =
    !activeTechnicalVisitId &&
    visitTemplateAvailable &&
    workflowStatusAllowsTechnicalVisit &&
    !createBlocked;

  const createDisabledReason = (() => {
    if (activeTechnicalVisitId) return null;
    if (!visitTemplateAvailable) {
      return "Aucun formulaire dynamique n’est associé à cette fiche CEE.";
    }
    if (!workflowStatusAllowsTechnicalVisit) {
      return "Le pipeline du workflow ne permet pas encore de créer la visite (qualifiez le dossier ou faites-le avancer).";
    }
    if (createBlocked && createBlockedReason) {
      return createBlockedReason;
    }
    if (createBlocked) {
      return "Complétez les informations du lead avant de créer la visite.";
    }
    return null;
  })();

  function onCreate() {
    setFeedback(null);
    setPostCreate(null);
    startTransition(async () => {
      const result = await createTechnicalVisitFromWorkflow({ workflowId });
      if (!result.ok) {
        if (result.existingTechnicalVisitId) {
          router.push(`/technical-visits/${result.existingTechnicalVisitId}`);
          router.refresh();
          return;
        }
        setFeedback({ type: "err", text: result.message });
        return;
      }
      if (result.warnings?.length) {
        setPostCreate({ visitId: result.technicalVisitId, warnings: result.warnings });
        return;
      }
      router.push(`/technical-visits/${result.technicalVisitId}`);
      router.refresh();
    });
  }

  if (postCreate) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
        <div className="space-y-3">
          <p className="font-medium text-foreground">Visite technique créée</p>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-amber-900 dark:text-amber-200/90">
            {postCreate.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                router.push(`/technical-visits/${postCreate.visitId}`);
                router.refresh();
                setPostCreate(null);
              }}
            >
              Ouvrir la visite technique
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPostCreate(null)}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ClipboardList className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="font-medium text-foreground">Visite technique</div>
            <p className="text-sm text-muted-foreground">
              {activeTechnicalVisitId
                ? "Une visite active est rattachée à ce workflow. Ouvrez la fiche pour la saisie terrain (formulaire dynamique)."
                : visitTemplateAvailable
                  ? "Créez la fiche visite pour ce dossier CEE. Une seule visite active est autorisée par workflow."
                  : "Ce workflow n’utilise pas encore un formulaire de visite dynamique (fiche non mappée)."}
            </p>
            {createDisabledReason && !activeTechnicalVisitId ? (
              <p className="text-sm text-amber-800 dark:text-amber-200/90">{createDisabledReason}</p>
            ) : null}
            {feedback ? (
              <p className="text-sm text-destructive" role="alert">
                {feedback.text}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {activeTechnicalVisitId ? (
            <Link
              href={`/technical-visits/${activeTechnicalVisitId}`}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              Ouvrir la visite technique
            </Link>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={!showCreate || isPending}
              title={!showCreate ? createDisabledReason ?? undefined : undefined}
              onClick={onCreate}
            >
              {isPending ? "Création…" : "Créer la visite technique"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
