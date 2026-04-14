import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import { contactDisplayName } from "@/features/leads/lib/contact-map";

export type CloserQueueItem = {
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
  restToCharge: number | null;
  recommendedModel: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  closerNotes: string | null;
  confirmateurNotes: string | null;
  closerHandoverNotes: string | null;
  lossReason: string | null;
};

export type CloserQueueBuckets = {
  pending: CloserQueueItem[];
  waitingSignature: CloserQueueItem[];
  followUps: CloserQueueItem[];
  signed: CloserQueueItem[];
  lost: CloserQueueItem[];
};

function getObjectValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }
  return (source as Record<string, unknown>)[key];
}

function getNumber(source: unknown, key: string): number | null {
  const value = getObjectValue(source, key);
  return typeof value === "number" ? value : null;
}

function getString(source: unknown, key: string): string | null {
  const value = getObjectValue(source, key);
  return typeof value === "string" && value.trim() ? value : null;
}

export function mapWorkflowToCloserQueueItem(
  workflow: WorkflowScopedListRow,
): CloserQueueItem {
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
    score: getNumber(workflow.simulation_result_json, "leadScore"),
    savingEuro: getNumber(workflow.simulation_result_json, "savingEur30Selected"),
    restToCharge: getNumber(workflow.simulation_result_json, "restToCharge"),
    recommendedModel: getString(workflow.simulation_result_json, "model"),
    lastContactAt: getString(workflow.qualification_data_json, "last_contact_at"),
    nextFollowUpAt: getString(workflow.qualification_data_json, "next_follow_up_at"),
    closerNotes: getString(workflow.qualification_data_json, "closer_notes") ?? workflow.closer_notes ?? null,
    confirmateurNotes: getString(workflow.qualification_data_json, "confirmateur_notes"),
    closerHandoverNotes: getString(workflow.qualification_data_json, "closer_handover_notes"),
    lossReason: getString(workflow.qualification_data_json, "loss_reason"),
  };
}

export function classifyCloserQueue(
  items: CloserQueueItem[],
  nowIso: string,
): CloserQueueBuckets {
  const pending = items.filter((item) => ["to_close", "docs_prepared"].includes(item.workflowStatus));
  const waitingSignature = items.filter((item) => item.workflowStatus === "agreement_sent");
  const followUps = items.filter(
    (item) =>
      Boolean(item.nextFollowUpAt) &&
      item.nextFollowUpAt! <= nowIso &&
      !["agreement_signed", "lost", "paid"].includes(item.workflowStatus),
  );
  const signed = items.filter((item) => ["agreement_signed", "paid", "quote_signed"].includes(item.workflowStatus));
  const lost = items.filter((item) => item.workflowStatus === "lost");

  const cap = 300;
  const recentCap = 120;
  return {
    pending: pending.slice(0, cap),
    waitingSignature: waitingSignature.slice(0, cap),
    followUps: followUps.slice(0, recentCap),
    signed: signed.slice(0, cap),
    lost: lost.slice(0, cap),
  };
}
