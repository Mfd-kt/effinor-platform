import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import { contactDisplayName } from "@/features/leads/lib/contact-map";
import { resolveAgentActivityNotesPreview } from "@/features/cee-workflows/lib/sync-agent-quick-note-to-internal-notes";

export type ConfirmateurQueueItem = {
  workflowId: string;
  leadId: string;
  companyName: string;
  civility: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  sheetCode: string | null;
  sheetLabel: string | null;
  workflowStatus: string;
  updatedAt: string;
  score: number | null;
  savingEuro: number | null;
  recommendedModel: string | null;
  recordingNotes: string | null;
};

export type ConfirmateurQueueBuckets = {
  pending: ConfirmateurQueueItem[];
  qualified: ConfirmateurQueueItem[];
  docsReady: ConfirmateurQueueItem[];
  recent: ConfirmateurQueueItem[];
};

function getSimulationValue(result: unknown, key: string): number | string | null {
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;
  const value = (result as Record<string, unknown>)[key];
  return typeof value === "number" || typeof value === "string" ? value : null;
}

export function mapWorkflowToConfirmateurQueueItem(
  workflow: WorkflowScopedListRow,
): ConfirmateurQueueItem {
  return {
    workflowId: workflow.id,
    leadId: workflow.lead_id,
    companyName: workflow.lead?.company_name ?? "Société inconnue",
    civility: workflow.lead?.civility ?? null,
    contactName: workflow.lead
      ? (contactDisplayName(workflow.lead) ?? workflow.lead.contact_name?.trim() ?? null)
      : null,
    phone: workflow.lead?.phone ?? null,
    email: workflow.lead?.email ?? null,
    sheetCode: workflow.cee_sheet?.code ?? null,
    sheetLabel: workflow.cee_sheet?.label ?? null,
    workflowStatus: workflow.workflow_status,
    updatedAt: workflow.updated_at,
    score: typeof getSimulationValue(workflow.simulation_result_json, "leadScore") === "number"
      ? (getSimulationValue(workflow.simulation_result_json, "leadScore") as number)
      : null,
    savingEuro: typeof getSimulationValue(workflow.simulation_result_json, "savingEur30Selected") === "number"
      ? (getSimulationValue(workflow.simulation_result_json, "savingEur30Selected") as number)
      : null,
    recommendedModel:
      typeof getSimulationValue(workflow.simulation_result_json, "model") === "string"
        ? (getSimulationValue(workflow.simulation_result_json, "model") as string)
        : null,
    recordingNotes: resolveAgentActivityNotesPreview(
      workflow.simulation_input_json,
      workflow.lead?.recording_notes,
    ),
  };
}

/** Limite par onglet (tableau CRM) — évite de charger une liste infinie côté client. */
const CONFIRMATEUR_QUEUE_TAB_CAP = 300;
const CONFIRMATEUR_RECENT_CAP = 120;

export function classifyConfirmateurQueue(
  items: ConfirmateurQueueItem[],
): ConfirmateurQueueBuckets {
  const pending = items.filter((item) =>
    ["simulation_done", "to_confirm"].includes(item.workflowStatus),
  );
  const qualified = items.filter((item) => item.workflowStatus === "qualified");
  const docsReady = items.filter((item) => ["docs_prepared", "to_close"].includes(item.workflowStatus));
  const recent = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, CONFIRMATEUR_RECENT_CAP);

  return {
    pending: pending.slice(0, CONFIRMATEUR_QUEUE_TAB_CAP),
    qualified: qualified.slice(0, CONFIRMATEUR_QUEUE_TAB_CAP),
    docsReady: docsReady.slice(0, CONFIRMATEUR_QUEUE_TAB_CAP),
    recent,
  };
}
