"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileCheck, Save, Send } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import {
  ConfirmateurQualificationForm,
  DEFAULT_CONFIRMATEUR_QUALIFICATION,
} from "@/features/cee-workflows/components/confirmateur-qualification-form";
import { ConfirmateurWorkflowDetail } from "@/features/cee-workflows/components/confirmateur-workflow-detail";
import { getConfirmateurHandoffLeadGaps } from "@/features/cee-workflows/lib/confirmateur-lead-completeness";
import { buildConfirmateurQueuePath } from "@/features/cee-workflows/lib/confirmateur-paths";
import {
  markConfirmateurWorkflowQualified,
  saveConfirmateurQualification,
  sendConfirmateurWorkflowToCloser,
} from "@/features/cee-workflows/actions/confirmateur-actions";
import {
  isWorkflowQualificationDataEmpty,
  mergeLeadFormDefaultsFromWorkflowSimulation,
  simulationResultHasData,
} from "@/features/leads/lib/merge-workflow-simulation-into-lead-form";
import { LeadForm } from "@/features/leads/components/lead-form";
import { LeadSimulationResults } from "@/features/leads/components/lead-simulation-results";
import { leadRowToFormValues } from "@/features/leads/lib/form-defaults";
import type { LeadDetailRow } from "@/features/leads/types";
import type { ConfirmateurWorkflowDetail as ConfirmateurWorkflowDetailData } from "@/features/cee-workflows/queries/get-confirmateur-workflow-detail";
import type { ConfirmateurQualificationInput } from "@/features/cee-workflows/schemas/confirmateur-workspace.schema";
import { extractWorkflowSimulationMetrics } from "@/features/leads/study-pdf/domain/merge-workflow-simulation-into-lead-for-pdf";
import { AGENT_PAC_CATALOG_PRODUCT_CODE, getRecommendedProductCodes } from "@/features/products/domain/recommend";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";
import { WorkflowTechnicalVisitCta } from "@/features/technical-visits/components/workflow-technical-visit-cta";

function qualificationFromWorkflow(detail: ConfirmateurWorkflowDetailData | null): ConfirmateurQualificationInput {
  const raw = detail?.workflow.qualification_data_json;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    const wf = detail?.workflow;
    const simOk = wf ? simulationResultHasData(wf.simulation_result_json) : false;
    return {
      ...DEFAULT_CONFIRMATEUR_QUALIFICATION,
      ...(simOk
        ? {
            coherence_simulation: true,
            technical_feasibility: true,
          }
        : {}),
    };
  }

  const src = raw as Record<string, unknown>;
  const base: ConfirmateurQualificationInput = {
    qualification_status:
      typeof src.qualification_status === "string"
        ? src.qualification_status
        : DEFAULT_CONFIRMATEUR_QUALIFICATION.qualification_status,
    dossier_complet: src.dossier_complet === true,
    coherence_simulation: src.coherence_simulation === true,
    technical_feasibility: src.technical_feasibility === true,
    missing_information: typeof src.missing_information === "string" ? src.missing_information : "",
    requires_technical_visit_override:
      typeof src.requires_technical_visit_override === "boolean"
        ? src.requires_technical_visit_override
        : null,
    quote_required_override:
      typeof src.quote_required_override === "boolean" ? src.quote_required_override : null,
  };

  const wf = detail?.workflow;
  const qualEmpty = wf ? isWorkflowQualificationDataEmpty(wf.qualification_data_json) : false;
  const simOk = wf ? simulationResultHasData(wf.simulation_result_json) : false;

  if (qualEmpty && simOk) {
    return {
      ...base,
      coherence_simulation: true,
      technical_feasibility: true,
    };
  }

  return base;
}

export function ConfirmateurWorkflowFocusPanel({
  detail,
  fullLead,
  destratProducts,
  sheetFilterId,
  activeTechnicalVisitId,
  visitTemplateAvailable,
  workflowStatusAllowsTechnicalVisit,
}: {
  detail: ConfirmateurWorkflowDetailData;
  fullLead: LeadDetailRow | null;
  destratProducts: SimulatorProductCardViewModel[];
  /** Id fiche CEE actif dans l’URL (retour file avec le même filtre). */
  sheetFilterId: string | null;
  activeTechnicalVisitId: string | null;
  visitTemplateAvailable: boolean;
  workflowStatusAllowsTechnicalVisit: boolean;
}) {
  const router = useRouter();
  const backHref = buildConfirmateurQueuePath(sheetFilterId);
  const [qualification, setQualification] = useState<ConfirmateurQualificationInput>(
    qualificationFromWorkflow(detail),
  );
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const leadFormDefaults = useMemo(() => {
    if (!fullLead) return null;
    return mergeLeadFormDefaultsFromWorkflowSimulation(leadRowToFormValues(fullLead), detail.workflow);
  }, [fullLead, detail]);

  const handoffLeadGaps = useMemo(
    () => (fullLead ? getConfirmateurHandoffLeadGaps(fullLead) : []),
    [fullLead],
  );

  const sendToCloserBlocked = !fullLead || handoffLeadGaps.length > 0;

  const recommendedProduct = useMemo(() => {
    const raw = detail.workflow.simulation_result_json;
    const metrics = extractWorkflowSimulationMetrics(raw);
    const cee = metrics?.ceeSolution;
    const sol =
      cee && typeof cee === "object" && !Array.isArray(cee) ? (cee as { solution?: string }).solution : null;
    if (sol === "PAC") {
      return destratProducts.find((product) => product.code === AGENT_PAC_CATALOG_PRODUCT_CODE) ?? null;
    }
    const modelField = metrics?.model;
    if (typeof modelField !== "string") return null;
    const recommendation = getRecommendedProductCodes(modelField as never);
    return destratProducts.find((product) => product.code === recommendation.primary) ?? null;
  }, [detail, destratProducts]);

  useEffect(() => {
    setQualification(qualificationFromWorkflow(detail));
  }, [detail]);

  const title =
    fullLead?.company_name?.trim() ||
    detail.workflow.lead?.company_name?.trim() ||
    "Dossier confirmateur";

  function runAction(mode: "save" | "qualify" | "send") {
    setFeedback(null);
    startTransition(async () => {
      const result =
        mode === "save"
          ? await saveConfirmateurQualification({
              workflowId: detail.workflow.id,
              qualification,
            })
          : mode === "qualify"
            ? await markConfirmateurWorkflowQualified({
                workflowId: detail.workflow.id,
                qualification,
              })
            : await sendConfirmateurWorkflowToCloser({
                workflowId: detail.workflow.id,
                qualification,
              });

      if (!result.ok) {
        setFeedback({ type: "err", text: result.message });
        return;
      }

      setFeedback({
        type: "ok",
        text:
          mode === "save"
            ? "Qualification enregistrée."
            : mode === "qualify"
              ? "Dossier marqué qualifié."
              : "Dossier transmis au closer.",
      });
      if (mode === "send") {
        router.push(backHref);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Contrôle, qualification, complément du lead et transmission au closer."
        actions={
          <Link
            href={backHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex items-center gap-1.5")}
          >
            <ArrowLeft className="size-4" />
            Retour à la file
          </Link>
        }
      />

      {fullLead && handoffLeadGaps.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-amber-950">À compléter avant envoi au closer</CardTitle>
            <CardDescription className="text-amber-900/85">
              Enregistrez le lead après modification. Tant que des éléments manquent, le bouton « Envoyer au closer »
              reste désactivé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-amber-950">
              {handoffLeadGaps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-5">
        <ConfirmateurWorkflowDetail detail={detail} recommendedProduct={recommendedProduct} />

        <WorkflowTechnicalVisitCta
          workflowId={detail.workflow.id}
          activeTechnicalVisitId={activeTechnicalVisitId}
          visitTemplateAvailable={visitTemplateAvailable}
          workflowStatusAllowsTechnicalVisit={workflowStatusAllowsTechnicalVisit}
          createBlocked={handoffLeadGaps.length > 0}
          createBlockedReason={
            handoffLeadGaps.length > 0
              ? "Complétez d’abord le lead (encadré « À compléter avant envoi au closer »)."
              : null
          }
        />

        {fullLead ? (
          <CollapsibleSection title="Simulateur commercial — détail du calcul" defaultOpen={false}>
            <p className="mb-3 max-w-4xl text-sm text-muted-foreground">
              Données issues du workflow agent (entrées, audit, résultats chiffrés). Les champs vides du formulaire
              lead sont pré-remplis à partir de ces valeurs lorsque c’est pertinent.
            </p>
            <LeadSimulationResults lead={fullLead} workflows={[detail.workflow]} />
          </CollapsibleSection>
        ) : null}

        {fullLead ? (
          <div className="space-y-3">
            <CollapsibleSection title="Informations du lead" defaultOpen>
              <p className="mb-4 max-w-4xl text-sm text-muted-foreground">
                Écoutez les enregistrements, complétez le dossier (transcription et synthèse depuis l’audio) et
                renseignez les champs administratifs. Les données de surface, hauteur, chauffage, type de bâtiment et
                score issus du simulateur sont proposées automatiquement lorsqu’elles manquent encore sur la fiche.
              </p>
              <LeadForm
                key={`${fullLead.id}-${detail.workflow.id}`}
                mode="edit"
                leadId={fullLead.id}
                defaultValues={leadFormDefaults ?? leadRowToFormValues(fullLead)}
                className="max-w-4xl"
                externalFooter
                formId={`confirmateur-lead-form-${fullLead.id}`}
              />
            </CollapsibleSection>
            <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                Sauvegarde automatique du lead (environ 1 s après la dernière modification).
              </p>
              <button
                type="submit"
                form={`confirmateur-lead-form-${fullLead.id}`}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Enregistrer le lead maintenant
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-900">
            Impossible de charger la fiche lead complète (accès ou lead supprimé). Les enregistrements et la saisie
            détaillée ne sont pas disponibles pour ce dossier.
          </div>
        )}

        <ConfirmateurQualificationForm value={qualification} onChange={setQualification} />

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Documents commerciaux</CardTitle>
            <CardDescription>
              La présentation commerciale et l&apos;accord sont générés par le closer depuis le poste closer, une fois
              le dossier reçu. La transmission exige en outre un lead complet (médias, contact, adresses,
              enregistrement audio).
            </CardDescription>
          </CardHeader>
        </Card>

        {feedback ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "ok"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}

        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex flex-wrap gap-3 py-4">
            <Button variant="outline" onClick={() => runAction("save")} disabled={isPending}>
              <Save className="mr-2 size-4" />
              Sauvegarder qualification
            </Button>
            <Button variant="secondary" onClick={() => runAction("qualify")} disabled={isPending}>
              <FileCheck className="mr-2 size-4" />
              Marquer qualifié
            </Button>
            <Button
              onClick={() => runAction("send")}
              disabled={isPending || sendToCloserBlocked}
              title={
                sendToCloserBlocked
                  ? "Complétez le lead (liste en haut de page) et la qualification avant transmission."
                  : undefined
              }
            >
              <Send className="mr-2 size-4" />
              Envoyer au closer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
