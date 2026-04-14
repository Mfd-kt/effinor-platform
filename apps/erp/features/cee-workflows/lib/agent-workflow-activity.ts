import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import { resolveAgentSimulatorDefinition } from "@/features/cee-workflows/lib/agent-simulator-registry";

export type AgentAvailableSheet = {
  id: string;
  code: string;
  label: string;
  simulatorKey: string | null;
  /** Profil calcul SQL (ex. coeff_zone_system_power pour fiches déstrat historiques). */
  calculationProfile: string | null;
  workflowKey: string | null;
  presentationTemplateKey: string | null;
  agreementTemplateKey: string | null;
  requiresTechnicalVisit: boolean;
  requiresQuote: boolean;
  isCommercialActive: boolean;
  description: string | null;
  controlPoints: string | null;
  teamName: string | null;
  roles: string[];
};

export type AgentActivityItem = {
  workflowId: string;
  leadId: string;
  companyName: string;
  sheetCode: string | null;
  sheetLabel: string | null;
  workflowStatus: string;
  updatedAt: string;
  score: number | null;
  savingEuro: number | null;
  recommendedModel: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  simulationInputJson: unknown;
  simulationResultJson: unknown;
};

export type AgentActivityBuckets = {
  drafts: AgentActivityItem[];
  validatedToday: AgentActivityItem[];
  sentToConfirmateur: AgentActivityItem[];
  recent: AgentActivityItem[];
};

function extractScore(simulationResultJson: unknown): number | null {
  if (!simulationResultJson || typeof simulationResultJson !== "object" || Array.isArray(simulationResultJson)) {
    return null;
  }
  const value = (simulationResultJson as Record<string, unknown>).leadScore;
  return typeof value === "number" ? value : null;
}

function extractSavingEuro(simulationResultJson: unknown): number | null {
  if (!simulationResultJson || typeof simulationResultJson !== "object" || Array.isArray(simulationResultJson)) {
    return null;
  }
  const value = (simulationResultJson as Record<string, unknown>).savingEur30Selected;
  return typeof value === "number" ? value : null;
}

function extractRecommendedModel(simulationResultJson: unknown): string | null {
  if (!simulationResultJson || typeof simulationResultJson !== "object" || Array.isArray(simulationResultJson)) {
    return null;
  }
  const value = (simulationResultJson as Record<string, unknown>).model;
  return typeof value === "string" ? value : null;
}

const AGENT_ACTIVITY_TAB_CAP = 300;
const AGENT_ACTIVITY_RECENT_CAP = 120;

export function mapWorkflowToAgentActivityItem(
  workflow: WorkflowScopedListRow,
  leadExtras?: {
    contactName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    notes?: string | null;
  },
): AgentActivityItem {
  return {
    workflowId: workflow.id,
    leadId: workflow.lead_id,
    companyName: workflow.lead?.company_name ?? "Société inconnue",
    sheetCode: workflow.cee_sheet?.code ?? null,
    sheetLabel: workflow.cee_sheet?.label ?? null,
    workflowStatus: workflow.workflow_status,
    updatedAt: workflow.updated_at,
    score: extractScore(workflow.simulation_result_json),
    savingEuro: extractSavingEuro(workflow.simulation_result_json),
    recommendedModel: extractRecommendedModel(workflow.simulation_result_json),
    contactName: leadExtras?.contactName ?? null,
    phone: leadExtras?.phone ?? null,
    email: leadExtras?.email ?? null,
    address: leadExtras?.address ?? null,
    city: leadExtras?.city ?? null,
    postalCode: leadExtras?.postalCode ?? null,
    notes: leadExtras?.notes ?? null,
    simulationInputJson: workflow.simulation_input_json,
    simulationResultJson: workflow.simulation_result_json,
  };
}

export function classifyAgentActivity(
  items: AgentActivityItem[],
  todayIsoDate: string,
): AgentActivityBuckets {
  const drafts = items.filter((item) => item.workflowStatus === "draft");
  const validatedToday = items.filter(
    (item) =>
      item.updatedAt.startsWith(todayIsoDate) &&
      (item.workflowStatus === "simulation_done" || item.workflowStatus === "qualified"),
  );
  const sentToConfirmateur = items.filter((item) =>
    ["to_confirm", "qualified", "docs_prepared", "to_close", "agreement_sent", "agreement_signed"].includes(
      item.workflowStatus,
    ),
  );
  const recent = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, AGENT_ACTIVITY_RECENT_CAP);

  return {
    drafts: drafts.slice(0, AGENT_ACTIVITY_TAB_CAP),
    validatedToday: validatedToday.slice(0, AGENT_ACTIVITY_TAB_CAP),
    sentToConfirmateur: sentToConfirmateur.slice(0, AGENT_ACTIVITY_TAB_CAP),
    recent,
  };
}

/** Variante cockpit : items déjà restreints aux workflows créés dans la période ; « validés » = mise à jour dans [start,end). */
export function classifyAgentActivityInRange(
  items: AgentActivityItem[],
  range: { startIso: string; endIso: string },
): AgentActivityBuckets {
  const drafts = items.filter((item) => item.workflowStatus === "draft");
  const validatedToday = items.filter(
    (item) =>
      item.updatedAt >= range.startIso &&
      item.updatedAt < range.endIso &&
      (item.workflowStatus === "simulation_done" || item.workflowStatus === "qualified"),
  );
  const sentToConfirmateur = items.filter((item) =>
    ["to_confirm", "qualified", "docs_prepared", "to_close", "agreement_sent", "agreement_signed"].includes(
      item.workflowStatus,
    ),
  );
  const recent = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, AGENT_ACTIVITY_RECENT_CAP);

  return {
    drafts: drafts.slice(0, AGENT_ACTIVITY_TAB_CAP),
    validatedToday: validatedToday.slice(0, AGENT_ACTIVITY_TAB_CAP),
    sentToConfirmateur: sentToConfirmateur.slice(0, AGENT_ACTIVITY_TAB_CAP),
    recent,
  };
}

export function resolveAgentInitialSheetId(
  sheets: AgentAvailableSheet[],
  preferredSheetId: string | null | undefined,
): string | null {
  if (sheets.length === 0) return null;
  if (preferredSheetId && sheets.some((sheet) => sheet.id === preferredSheetId)) {
    return preferredSheetId;
  }
  if (sheets.length === 1) {
    return sheets[0]?.id ?? null;
  }

  const destrat = sheets.find((sheet) => resolveAgentSimulatorDefinition(sheet).kind === "destrat");
  return destrat?.id ?? sheets[0]?.id ?? null;
}
