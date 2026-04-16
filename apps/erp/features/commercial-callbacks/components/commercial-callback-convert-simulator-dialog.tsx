"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Headset, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
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
import { finalizeCommercialCallbackWithSimulation } from "@/features/cee-workflows/actions/agent-actions";
import {
  DEFAULT_AGENT_DESTRAT_STATE,
  computeAgentDestratPreview,
  type AgentDestratFormState,
} from "@/features/cee-workflows/lib/agent-destrat-simulator";
import {
  resolveAgentInitialSheetId,
  type AgentAvailableSheet,
} from "@/features/cee-workflows/lib/agent-workflow-activity";
import {
  resolveAgentSimulatorDefinition,
  type AgentSimulatorDefinition,
} from "@/features/cee-workflows/lib/agent-simulator-registry";
import { AGENT_PAC_CATALOG_PRODUCT_CODE, getRecommendedProductCodes } from "@/features/products/domain/recommend";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";
import { formatHeatingModeLabelFr } from "@/features/leads/simulator/schemas/simulator.schema";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function callbackRowToDatetimeLocal(row: CommercialCallbackRow): string {
  const date = row.callback_date?.trim();
  if (!date) return "";
  const timeRaw = row.callback_time?.trim() || "09:00:00";
  const hhmm = timeRaw.slice(0, 5);
  return `${date}T${hhmm}`;
}

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

function prospectFromCallback(row: CommercialCallbackRow): AgentProspectFormValue {
  const noteBlocks = [row.callback_comment, row.call_context_summary].filter(
    (s): s is string => Boolean(s && String(s).trim()),
  );
  return {
    companyName: row.company_name,
    civility: "",
    contactName: row.contact_name,
    phone: row.phone,
    callbackAt: callbackRowToDatetimeLocal(row),
    email: row.email ?? "",
    address: "",
    city: "",
    postalCode: "",
    notes: noteBlocks.join("\n\n"),
  };
}

export function CommercialCallbackConvertSimulatorDialog({
  open,
  onOpenChange,
  row,
  sheets,
  destratProducts,
  onConverted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: CommercialCallbackRow | null;
  sheets: AgentAvailableSheet[];
  destratProducts: SimulatorProductCardViewModel[];
  onConverted?: () => void;
}) {
  const router = useRouter();
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [prospect, setProspect] = useState<AgentProspectFormValue>(DEFAULT_AGENT_PROSPECT_FORM);
  const [destratState, setDestratState] = useState<AgentDestratFormState>(DEFAULT_AGENT_DESTRAT_STATE);
  const [destratUiStep, setDestratUiStep] = useState<1 | 2>(1);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !row) return;
    setProspect(prospectFromCallback(row));
    setFeedback(null);
  }, [open, row?.id]);

  useEffect(() => {
    if (!open || sheets.length === 0) {
      setActiveSheetId(null);
      return;
    }
    setActiveSheetId((prev) => {
      if (prev && sheets.some((s) => s.id === prev)) return prev;
      return resolveAgentInitialSheetId(sheets, null);
    });
  }, [open, sheets]);

  useEffect(() => {
    if (!open) return;
    setDestratState(DEFAULT_AGENT_DESTRAT_STATE);
    setDestratUiStep(1);
  }, [open, row?.id, activeSheetId]);

  const activeSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === activeSheetId) ?? null,
    [activeSheetId, sheets],
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
  const canValidate = canSaveDraft && Boolean(previewResult);

  function buildPayload() {
    if (!activeSheet || !row) return null;
    return {
      callbackId: row.id,
      workflowId: undefined as string | undefined,
      leadId: undefined as string | undefined,
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

  function submitConversion() {
    const payload = buildPayload();
    if (!payload) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await finalizeCommercialCallbackWithSimulation(payload);
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
      toast.success("Rappel converti — simulation validée.");
      onOpenChange(false);
      onConverted?.();
      router.refresh();
    });
  }

  if (!row) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,1440px)] max-w-[min(96vw,1440px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1440px)]">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>Convertir — {row.company_name}</DialogTitle>
          <DialogDescription>
            Complétez et validez la simulation sur cette page. La conversion du rappel n&apos;est enregistrée qu&apos;une
            fois la simulation validée.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {sheets.length === 0 ? (
            <EmptyState
              title="Aucune fiche autorisée"
              description="Aucune fiche CEE n’est disponible pour lancer un simulateur. Demandez l’accès ou utilisez un compte agent configuré."
              icon={<Headset className="size-6" />}
            />
          ) : !activeSheet ? (
            <EmptyState
              title="Aucune fiche active"
              description="Impossible de résoudre une fiche CEE. Vérifiez l’affectation équipe."
              icon={<TriangleAlert className="size-6" />}
            />
          ) : (
            <div className="space-y-5">
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
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
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
                  <CardTitle className="text-base">Conversion</CardTitle>
                  <CardDescription>
                    {simulatorDefinition.kind === "destrat" && destratUiStep === 1
                      ? "Terminez l’étape 1 puis passez à l’étape 2 avant de convertir."
                      : "Le rappel sera clôturé et le lead créé uniquement si la simulation est valide."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={submitConversion}
                    disabled={
                      !canValidate ||
                      isPending ||
                      sheets.length === 0 ||
                      (simulatorDefinition.kind === "destrat" && destratUiStep === 1)
                    }
                  >
                    Convertir en lead (simulation validée)
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
