"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Headset, Plus, Send, Save, Sigma, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
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

export type AgentSimulatorLeadSession = { leadId: string } & AgentProspectFormValue;
import { AgentSheetSelector } from "@/features/cee-workflows/components/agent-sheet-selector";
import { AgentSheetSimulatorPanel } from "@/features/cee-workflows/components/agent-sheet-simulator-panel";
import { AgentWorkflowActivityPanel } from "@/features/cee-workflows/components/agent-workflow-activity-panel";
import { saveAgentWorkflowDraft, sendAgentWorkflowToConfirmateur, validateAgentWorkflowSimulation } from "@/features/cee-workflows/actions/agent-actions";
import { DEFAULT_AGENT_DESTRAT_STATE, computeAgentDestratPreview, extractAgentDestratStateFromJson, type AgentDestratFormState } from "@/features/cee-workflows/lib/agent-destrat-simulator";
import type { AgentActivityBuckets, AgentActivityItem, AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import { resolveAgentInitialSheetId } from "@/features/cee-workflows/lib/agent-workflow-activity";
import {
  resolveAgentSimulatorDefinition,
  type AgentSimulatorDefinition,
} from "@/features/cee-workflows/lib/agent-simulator-registry";
import { getRecommendedProductCodes } from "@/features/products/domain/recommend";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";
import { formatHeatingModeLabelFr } from "@/features/leads/simulator/schemas/simulator.schema";
import { CommercialCallbackSheet } from "@/features/commercial-callbacks/components/commercial-callback-sheet";
import { CommercialCallbacksSection } from "@/features/commercial-callbacks/components/commercial-callbacks-section";
import type {
  CallbackPerformanceStats,
  CommercialCallbackKpis,
} from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

const SHEET_STORAGE_KEY = "agent-workstation:last-sheet-id";

function formatCurrencyEur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function inferDestratUiStep(sheet: AgentAvailableSheet | null, state: AgentDestratFormState): 1 | 2 {
  if (!sheet) return 1;
  if (resolveAgentSimulatorDefinition(sheet).kind !== "destrat") return 1;
  return computeAgentDestratPreview(state).ok ? 2 : 1;
}

function makeEmptyMessage(message: string) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function prospectFromActivity(item: AgentActivityItem): AgentProspectFormValue {
  return {
    companyName: item.companyName,
    civility: item.civility ?? "",
    contactName: item.contactName ?? "",
    phone: item.phone ?? "",
    email: item.email ?? "",
    address: item.address ?? "",
    city: item.city ?? "",
    postalCode: item.postalCode ?? "",
    notes: item.notes ?? "",
  };
}

function ContextCard({ sheet }: { sheet: AgentAvailableSheet }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span>{sheet.label}</span>
          <Badge variant="secondary">{sheet.code}</Badge>
        </CardTitle>
        <CardDescription>Fiche active pour ce simulateur.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {sheet.simulatorKey ? <Badge variant="outline">Simulateur {sheet.simulatorKey}</Badge> : null}
          {sheet.teamName ? <Badge variant="outline">{sheet.teamName}</Badge> : null}
          {sheet.roles.map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </div>
        {sheet.description ? <p className="text-muted-foreground">{sheet.description}</p> : null}
        {sheet.controlPoints ? (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-muted-foreground">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground/70">Rappel / angle commercial</div>
            <div className="line-clamp-4 whitespace-pre-wrap text-xs">{sheet.controlPoints}</div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AgentWorkstation({
  sheets,
  activity,
  destratProducts,
  commercialCallbacks,
  callbackKpis,
  callbackPerformance,
  /** Fiche CEE à privilégier (ex. `?lead=` résolu côté serveur) — prime sur le dernier choix en localStorage. */
  initialSheetId = null,
  /** Ouvre le simulateur avec prospect prérempli (ex. conversion rappel → `?lead=&simulator=1`). */
  initialSimulatorSession = null,
}: {
  sheets: AgentAvailableSheet[];
  activity: AgentActivityBuckets;
  destratProducts: SimulatorProductCardViewModel[];
  commercialCallbacks: CommercialCallbackRow[];
  callbackKpis: CommercialCallbackKpis;
  callbackPerformance: CallbackPerformanceStats;
  initialSheetId?: string | null;
  initialSimulatorSession?: AgentSimulatorLeadSession | null;
}) {
  const router = useRouter();
  const skipDraftHydrate = useRef(false);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(() => {
    const trimmed = initialSheetId?.trim() ?? "";
    const urlOk = trimmed && sheets.some((s) => s.id === trimmed) ? trimmed : null;
    return resolveAgentInitialSheetId(sheets, urlOk);
  });
  const [prospect, setProspect] = useState<AgentProspectFormValue>(DEFAULT_AGENT_PROSPECT_FORM);
  const [destratState, setDestratState] = useState<AgentDestratFormState>(DEFAULT_AGENT_DESTRAT_STATE);
  const [workflowId, setWorkflowId] = useState<string | undefined>();
  const [leadId, setLeadId] = useState<string | undefined>();
  const [workflowStatus, setWorkflowStatus] = useState<string>("draft");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [destratUiStep, setDestratUiStep] = useState<1 | 2>(1);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [callbackSheetOpen, setCallbackSheetOpen] = useState(false);
  const [callbackEditing, setCallbackEditing] = useState<CommercialCallbackRow | null>(null);
  const simulatorBootstrapRef = useRef<string | null>(null);

  useEffect(() => {
    const key = initialSimulatorSession?.leadId ?? null;
    if (!initialSimulatorSession || !key) {
      return;
    }
    if (simulatorBootstrapRef.current === key) {
      return;
    }
    simulatorBootstrapRef.current = key;
    skipDraftHydrate.current = true;
    const { leadId: sessionLeadId, ...prospectVals } = initialSimulatorSession;
    setLeadId(sessionLeadId);
    setWorkflowId(undefined);
    setWorkflowStatus("draft");
    setProspect(prospectVals);
    setDestratState(DEFAULT_AGENT_DESTRAT_STATE);
    setDestratUiStep(1);
    setFeedback(null);
    queueMicrotask(() => setSimulatorOpen(true));
  }, [initialSimulatorSession]);

  useEffect(() => {
    const trimmed = initialSheetId?.trim() ?? "";
    const urlOk = trimmed && sheets.some((s) => s.id === trimmed) ? trimmed : null;
    const saved = typeof window === "undefined" ? null : window.localStorage.getItem(SHEET_STORAGE_KEY);
    const resolved = resolveAgentInitialSheetId(sheets, urlOk ?? saved);
    if (resolved) {
      queueMicrotask(() => setActiveSheetId(resolved));
    }
  }, [sheets, initialSheetId]);

  useEffect(() => {
    if (activeSheetId && typeof window !== "undefined") {
      window.localStorage.setItem(SHEET_STORAGE_KEY, activeSheetId);
    }
  }, [activeSheetId]);

  const activeSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === activeSheetId) ?? null,
    [activeSheetId, sheets],
  );

  const activeDraft = useMemo(() => {
    if (!activeSheet) return null;
    return activity.drafts.find((item) => item.sheetCode === activeSheet.code) ?? null;
  }, [activeSheet, activity.drafts]);

  useEffect(() => {
    if (skipDraftHydrate.current || simulatorOpen) {
      return;
    }
    queueMicrotask(() => {
      if (skipDraftHydrate.current || simulatorOpen) return;
      if (!activeDraft) {
        setWorkflowId(undefined);
        setLeadId(undefined);
        setWorkflowStatus("draft");
        setProspect(DEFAULT_AGENT_PROSPECT_FORM);
        setDestratState(DEFAULT_AGENT_DESTRAT_STATE);
        setDestratUiStep(1);
        return;
      }

      setWorkflowId(activeDraft.workflowId);
      setLeadId(activeDraft.leadId);
      setWorkflowStatus(activeDraft.workflowStatus);
      setProspect(prospectFromActivity(activeDraft));
      const nextDestrat = extractAgentDestratStateFromJson(activeDraft.simulationInputJson);
      setDestratState(nextDestrat);
      if (activeSheet) {
        setDestratUiStep(inferDestratUiStep(activeSheet, nextDestrat));
      }
    });
  }, [activeDraft, activeSheet, simulatorOpen]);

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
    const recommendation = getRecommendedProductCodes(previewResult.model);
    return destratProducts.find((product) => product.code === recommendation.primary) ?? null;
  }, [destratProducts, previewResult, simulatorDefinition.kind]);

  const canSaveDraft = Boolean(activeSheet && prospect.companyName.trim() && prospect.contactName.trim() && prospect.phone.trim());
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

  function openNewSimulator() {
    if (!activeSheet) return;
    skipDraftHydrate.current = true;
    setWorkflowId(undefined);
    setLeadId(undefined);
    setWorkflowStatus("draft");
    setProspect(DEFAULT_AGENT_PROSPECT_FORM);
    setDestratState(DEFAULT_AGENT_DESTRAT_STATE);
    setDestratUiStep(1);
    setFeedback(null);
    setSimulatorOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setSimulatorOpen(open);
    if (!open) {
      skipDraftHydrate.current = false;
    }
  }

  function handleResume(item: AgentActivityItem) {
    skipDraftHydrate.current = false;
    const sheet = sheets.find((candidate) => candidate.code === item.sheetCode);
    if (sheet) {
      setActiveSheetId(sheet.id);
    }
    setWorkflowId(item.workflowId);
    setLeadId(item.leadId);
    setWorkflowStatus(item.workflowStatus);
    setProspect(prospectFromActivity(item));
    const nextDestrat = extractAgentDestratStateFromJson(item.simulationInputJson);
    setDestratState(nextDestrat);
    setDestratUiStep(sheet ? inferDestratUiStep(sheet, nextDestrat) : 1);
    setFeedback(null);
    setSimulatorOpen(true);
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
      setSimulatorOpen(false);
      router.refresh();
    });
  }

  function openNewCallback() {
    setCallbackEditing(null);
    setCallbackSheetOpen(true);
  }

  function handleCallbackSheetOpenChange(open: boolean) {
    setCallbackSheetOpen(open);
    if (!open) {
      setCallbackEditing(null);
    }
  }

  function renderSimulatorShell() {
    if (sheets.length === 0) {
      return (
        <EmptyState
          title="Aucune fiche autorisée"
          description="Aucune fiche CEE active n’est affectée à votre compte pour le poste agent."
          icon={<Headset className="size-6" />}
        />
      );
    }

    if (!activeSheet) {
      return (
        <EmptyState
          title="Aucune fiche active"
          description="Sélectionnez ou configurez une fiche CEE active pour commencer."
          icon={<TriangleAlert className="size-6" />}
        />
      );
    }

    return (
      <>
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">Mes fiches autorisées</div>
          <AgentSheetSelector sheets={sheets} activeSheetId={activeSheetId} onSelect={setActiveSheetId} />
        </div>

        <AgentWorkflowActivityPanel activity={activity} onResume={handleResume} />

      <Dialog open={simulatorOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[92vh] w-[min(96vw,1440px)] max-w-[min(96vw,1440px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1440px)]">
          <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
            <DialogTitle>Simulateur — {activeSheet.label}</DialogTitle>
            <DialogDescription>
              Étape de simulation et coordonnées prospect ; enregistrez le brouillon, validez ou envoyez au confirmateur.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-5">
              <ContextCard sheet={activeSheet} />

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
          </div>
        </DialogContent>
      </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poste Agent"
        description="Suivi commercial (rappels) et dossiers CEE : vos opportunités et le simulateur sur vos fiches autorisées."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={openNewCallback} className="gap-1.5">
              <CalendarClock className="size-4" />
              Nouveau rappel
            </Button>
            {sheets.length > 0 && activeSheet ? (
              <>
                <Button type="button" size="sm" onClick={openNewSimulator} className="gap-1.5">
                  <Plus className="size-4" />
                  Nouveau
                </Button>
                {workflowId ? (
                  <Badge variant="outline" className="font-normal">
                    Dernier workflow : {workflowStatus}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Prêt</Badge>
                )}
              </>
            ) : null}
          </div>
        }
      />

      <CommercialCallbacksSection
        rows={commercialCallbacks}
        kpis={callbackKpis}
        performance={callbackPerformance}
        onOpenNew={openNewCallback}
        onEdit={(row) => {
          setCallbackEditing(row);
          setCallbackSheetOpen(true);
        }}
        agentSimulator={{ sheets, destratProducts }}
      />

      <CommercialCallbackSheet
        open={callbackSheetOpen}
        onOpenChange={handleCallbackSheetOpenChange}
        editing={callbackEditing}
        onSaved={() => router.refresh()}
      />

      {renderSimulatorShell()}
    </div>
  );
}
