"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Sigma } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AgentProspectForm,
  DEFAULT_AGENT_PROSPECT_FORM,
  type AgentProspectFormValue,
} from "@/features/cee-workflows/components/agent-prospect-form";
import { AgentSimulatorContextCard } from "@/features/cee-workflows/components/agent-simulator-context-card";
import { AgentSheetSimulatorPanel } from "@/features/cee-workflows/components/agent-sheet-simulator-panel";
import { saveAgentWorkflowDraft, sendAgentWorkflowToConfirmateur, validateAgentWorkflowSimulation } from "@/features/cee-workflows/actions/agent-actions";
import type { AgentSimulatorLeadSession } from "@/features/cee-workflows/types/agent-simulator-lead-session";
import { DEFAULT_AGENT_DESTRAT_STATE, computeAgentDestratPreview, type AgentDestratFormState } from "@/features/cee-workflows/lib/agent-destrat-simulator";
import type { AgentActivityBuckets, AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import { resolveAgentInitialSheetId } from "@/features/cee-workflows/lib/agent-workflow-activity";
import { resolveAgentSimulatorHeadlines } from "@/features/cee-workflows/lib/agent-simulator-headlines";
import {
  resolveAgentSimulatorDefinition,
  type AgentSimulatorDefinition,
} from "@/features/cee-workflows/lib/agent-simulator-registry";
import { AGENT_PAC_CATALOG_PRODUCT_CODE, getRecommendedProductCodes } from "@/features/products/domain/recommend";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";
import { formatHeatingModeLabelFr } from "@/features/leads/simulator/schemas/simulator.schema";
import { attachLeadGenerationConversionAction } from "@/features/lead-generation/actions/attach-lead-generation-conversion-action";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { buildAgentSimulatorSessionFromLeadGenerationStock } from "@/features/lead-generation/lib/build-agent-simulator-session-from-lg-stock";

function formatCurrencyEur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function makeEmptyMessage(message: string) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export type LeadGenerationCeeSimulatorModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: LeadGenerationStockRow;
  sheets: AgentAvailableSheet[];
  activity: AgentActivityBuckets;
  destratProducts: SimulatorProductCardViewModel[];
  /** Après conversion lead gen réussie */
  onConversionComplete?: () => void;
};

/**
 * Même simulateur CEE que sur le poste agent, en modale sur la fiche « Ma file ».
 */
export function LeadGenerationCeeSimulatorModal({
  open,
  onOpenChange,
  stock,
  sheets,
  activity: _activity,
  destratProducts,
  onConversionComplete,
}: LeadGenerationCeeSimulatorModalProps) {
  const router = useRouter();
  const skipDraftHydrate = useRef(true);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(() => resolveAgentInitialSheetId(sheets, null));
  const [prospect, setProspect] = useState<AgentProspectFormValue>(DEFAULT_AGENT_PROSPECT_FORM);
  const [destratState, setDestratState] = useState<AgentDestratFormState>(DEFAULT_AGENT_DESTRAT_STATE);
  const [workflowId, setWorkflowId] = useState<string | undefined>();
  const [leadId, setLeadId] = useState<string | undefined>();
  const [workflowStatus, setWorkflowStatus] = useState<string>("draft");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [destratUiStep, setDestratUiStep] = useState<1 | 2>(1);
  const [leadGenStockId, setLeadGenStockId] = useState<string | null>(null);
  const appliedOpenRef = useRef(false);

  useEffect(() => {
    if (sheets.length === 0) return;
    setActiveSheetId((prev) => {
      if (prev && sheets.some((s) => s.id === prev)) return prev;
      return resolveAgentInitialSheetId(sheets, null);
    });
  }, [sheets]);

  useEffect(() => {
    if (!open) {
      appliedOpenRef.current = false;
      return;
    }
    if (appliedOpenRef.current) return;
    appliedOpenRef.current = true;
    skipDraftHydrate.current = true;
    const session: AgentSimulatorLeadSession = buildAgentSimulatorSessionFromLeadGenerationStock(stock);
    setLeadGenStockId(session.leadGenerationStockId ?? stock.id);
    setLeadId(undefined);
    setWorkflowId(undefined);
    setWorkflowStatus("draft");
    setProspect({
      companyName: session.companyName,
      civility: session.civility,
      contactName: session.contactName,
      phone: session.phone,
      callbackAt: session.callbackAt,
      email: session.email,
      address: session.address,
      city: session.city,
      postalCode: session.postalCode,
      notes: session.notes,
    });
    setDestratState(DEFAULT_AGENT_DESTRAT_STATE);
    setDestratUiStep(1);
    setFeedback(null);
  }, [open, stock]);

  const activeSheet = useMemo(
    () => sheets.find((s) => s.id === activeSheetId) ?? null,
    [sheets, activeSheetId],
  );

  const simulatorDefinition: AgentSimulatorDefinition = activeSheet
    ? resolveAgentSimulatorDefinition(activeSheet)
    : {
        kind: "unsupported",
        title: "Simulateur bientôt disponible",
        description: "Sélectionnez une fiche CEE pour afficher le simulateur.",
      };

  const destratPreview = useMemo(
    () => (simulatorDefinition.kind === "destrat" ? computeAgentDestratPreview(destratState) : null),
    [destratState, simulatorDefinition.kind],
  );
  const previewResult = destratPreview?.ok ? destratPreview.result : null;

  const simulatorUiHeadlines = useMemo(() => {
    if (!activeSheet) {
      return { dialogTitle: "Simulateur CEE", contextTitle: "", contextBadge: "", contextDescription: "" };
    }
    return resolveAgentSimulatorHeadlines(activeSheet.label, activeSheet.code, previewResult);
  }, [activeSheet, previewResult]);

  const recommendedProduct = useMemo(() => {
    if (!previewResult || simulatorDefinition.kind !== "destrat") return null;
    if (previewResult.ceeSolution.solution === "PAC") {
      return destratProducts.find((product) => product.code === AGENT_PAC_CATALOG_PRODUCT_CODE) ?? null;
    }
    const recommendation = getRecommendedProductCodes(previewResult.model);
    return destratProducts.find((product) => product.code === recommendation.primary) ?? null;
  }, [destratProducts, previewResult, simulatorDefinition.kind]);

  const canSaveDraft = Boolean(
    activeSheet &&
      prospect.companyName.trim() &&
      prospect.contactName.trim() &&
      prospect.phone.trim() &&
      prospect.callbackAt.trim(),
  );
  const canValidate = canSaveDraft && Boolean(previewResult) && workflowStatus !== "to_confirm";
  const canSend = canValidate && workflowStatus !== "to_confirm";

  function buildPayload() {
    if (!activeSheet) return null;
    return {
      workflowId,
      leadId,
      ceeSheetId: activeSheet.id,
      prospect,
      simulationInputJson:
        simulatorDefinition.kind === "destrat" && previewResult
          ? {
              ...destratState,
              input: {
                buildingHeated: destratState.buildingHeated,
                clientType: previewResult.clientType,
                heightM: previewResult.heightM,
                surfaceM2: previewResult.surfaceM2,
                heatingMode: previewResult.heatingMode,
                model: previewResult.model,
                consigne: previewResult.consigne,
              },
            }
          : undefined,
      simulationResultJson: previewResult ?? undefined,
    };
  }

  function handleDialogOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      skipDraftHydrate.current = false;
      setLeadGenStockId(null);
    }
  }

  function handleAction(mode: "draft" | "validate" | "send") {
    const payload = buildPayload();
    if (!payload) return;

    setFeedback(null);
    startTransition(async () => {
      const result =
        mode === "draft"
          ? await saveAgentWorkflowDraft(payload)
          : mode === "validate"
            ? await validateAgentWorkflowSimulation(payload)
            : await sendAgentWorkflowToConfirmateur(payload);

      if (!result.ok) {
        setFeedback({
          type: "err",
          text:
            result.duplicateLeadId && result.duplicateReason
              ? `${result.message} Lead existant: ${result.duplicateLeadId}.`
              : result.message,
        });
        return;
      }

      if (leadGenStockId && (mode === "validate" || mode === "send")) {
        const attach = await attachLeadGenerationConversionAction({
          stockId: leadGenStockId,
          leadId: result.leadId,
        });
        if (!attach.ok) {
          setFeedback({ type: "err", text: attach.error });
          return;
        }
        setLeadGenStockId(null);
        skipDraftHydrate.current = false;
        handleDialogOpenChange(false);
        router.refresh();
        onConversionComplete?.();
        return;
      }

      skipDraftHydrate.current = false;
      setWorkflowId(result.workflowId);
      setLeadId(result.leadId);
      setWorkflowStatus(mode === "draft" ? "draft" : mode === "validate" ? "simulation_done" : "to_confirm");
      setFeedback({
        type: "ok",
        text:
          mode === "draft"
            ? "Brouillon enregistré."
            : mode === "validate"
              ? "Simulation validée."
              : "Dossier transmis au confirmateur.",
      });
      handleDialogOpenChange(false);
      router.refresh();
    });
  }

  if (sheets.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simulateur indisponible</DialogTitle>
            <DialogDescription>
              Aucune fiche CEE n’est affectée à votre compte. Contactez un administrateur ou utilisez la conversion
              rapide si elle est proposée.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,1440px)] max-w-[min(96vw,1440px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1440px)]">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>{simulatorUiHeadlines.dialogTitle}</DialogTitle>
          <DialogDescription>
            Simulation CEE et coordonnées prospect — même outil que sur le poste agent. Validez ou envoyez au
            confirmateur pour créer le prospect CRM et clôturer la fiche Lead Gen.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {!activeSheet ? (
            makeEmptyMessage("Impossible de résoudre une fiche CEE active pour votre compte.")
          ) : (
            <div className="space-y-5">
              {sheets.length > 1 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Fiche CEE</p>
                  <select
                    className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
                    value={activeSheetId ?? ""}
                    onChange={(e) => setActiveSheetId(e.target.value || null)}
                  >
                    {sheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <AgentSimulatorContextCard sheet={activeSheet} previewResult={previewResult} />

              {simulatorDefinition.kind === "destrat" ? (
                <>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Étape {destratUiStep} sur 2</p>
                      <p className="text-xs text-muted-foreground">{destratUiStep === 1 ? 50 : 100}%</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: destratUiStep === 1 ? "50%" : "100%" }}
                      />
                    </div>
                  </div>

                  {destratUiStep === 2 ? (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-semibold text-foreground">Étape 2 — Coordonnées prospect</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => setDestratUiStep(1)}>
                          Retour à l&apos;étape 1
                        </Button>
                      </div>
                      {previewResult ? (
                        <p className="text-sm text-muted-foreground">
                          Mode retenu : {formatHeatingModeLabelFr(previewResult.heatingMode)} — coût annuel estimé ~
                          {formatCurrencyEur(previewResult.costYearSelected)}, économie 30 % ~
                          {formatCurrencyEur(previewResult.savingEur30Selected)}/an.
                        </p>
                      ) : null}
                      <AgentProspectForm value={prospect} onChange={setProspect} />
                      <AgentSheetSimulatorPanel
                        sheet={activeSheet}
                        value={destratState}
                        onChange={setDestratState}
                        companyNameForScript={prospect.companyName}
                        previewResult={previewResult}
                        recommendedProduct={recommendedProduct}
                        destratFlowStep={2}
                        simulationDisabled={isPending}
                      />
                    </>
                  ) : (
                    <AgentSheetSimulatorPanel
                      sheet={activeSheet}
                      value={destratState}
                      onChange={setDestratState}
                      companyNameForScript={prospect.companyName}
                      previewResult={previewResult}
                      recommendedProduct={recommendedProduct}
                      destratFlowStep={1}
                      onDestratGoToStep2={() => setDestratUiStep(2)}
                      onDestratResetSimulation={() => setDestratState(DEFAULT_AGENT_DESTRAT_STATE)}
                      simulationDisabled={isPending}
                    />
                  )}
                </>
              ) : (
                <>
                  <AgentProspectForm value={prospect} onChange={setProspect} />
                  <AgentSheetSimulatorPanel
                    sheet={activeSheet}
                    value={destratState}
                    onChange={setDestratState}
                    companyNameForScript={prospect.companyName}
                    previewResult={previewResult}
                    recommendedProduct={recommendedProduct}
                    simulationDisabled={isPending}
                  />
                </>
              )}

              {feedback ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    feedback.type === "ok"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}
                >
                  {feedback.text}
                </div>
              ) : null}

              {simulatorDefinition.kind === "destrat" && destratPreview && !destratPreview.ok
                ? makeEmptyMessage(destratPreview.message)
                : null}

              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Enregistrer</CardTitle>
                  <CardDescription>
                    {simulatorDefinition.kind === "destrat" && destratUiStep === 1
                      ? "Passez à l’étape 2 pour saisir le prospect puis enregistrer."
                      : "Brouillon, validation ou envoi au confirmateur."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction("draft")}
                    disabled={!canSaveDraft || isPending || (simulatorDefinition.kind === "destrat" && destratUiStep === 1)}
                  >
                    <Save className="mr-2 size-4" />
                    Enregistrer brouillon
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAction("validate")}
                    disabled={!canValidate || isPending || (simulatorDefinition.kind === "destrat" && destratUiStep === 1)}
                  >
                    <Sigma className="mr-2 size-4" />
                    Valider simulation
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction("send")}
                    disabled={!canSend || isPending || (simulatorDefinition.kind === "destrat" && destratUiStep === 1)}
                    className="min-w-[12rem]"
                  >
                    <Send className="mr-2 size-4" />
                    Envoyer au confirmateur
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
