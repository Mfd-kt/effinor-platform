import { z } from "zod";

import { isTerminalCallbackStatus } from "@/features/commercial-callbacks/domain/callback-dates";
import type { CockpitAiActionType, CockpitAiRecommendation } from "@/features/cockpit/types";
import type { Database, Json } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Supabase = SupabaseClient<Database>;

const uuid = z.string().uuid();

export type ResolvedAiAction = {
  actionType: CockpitAiActionType;
  payload: Json;
};

function viewAutomation(redirect: string): ResolvedAiAction {
  return { actionType: "view_automation", payload: { redirect } };
}

function notifyUser(title: string, body: string, targetUserId: string | null): ResolvedAiAction {
  return {
    actionType: "notify_user",
    payload: {
      title: title.slice(0, 200),
      body: body.slice(0, 2000),
      target_user_id: targetUserId,
    },
  };
}

type RecSlice = Pick<
  CockpitAiRecommendation,
  "id" | "title" | "description" | "phone" | "relatedEntityId" | "canConvertCallback"
>;

/**
 * Résout l’action à partir de l’id et optionnellement du texte affiché (reco).
 * Si `rec` est absent (exécution serveur sans contexte), utilise des libellés génériques.
 */
export function resolveRecommendationAction(id: string, rec: RecSlice | null): ResolvedAiAction | null {
  const title = rec?.title ?? "Recommandation cockpit";
  const description = rec?.description ?? "Action depuis le cockpit direction.";
  const phone = rec?.phone ?? null;
  const relatedEntityId = rec?.relatedEntityId ?? null;
  const canConvertCallback = rec?.canConvertCallback ?? false;

  if (id === "ai:automation-cron-health" || id === "ai:automation-channels") {
    return viewAutomation("/cockpit");
  }
  if (id === "ai:automation-callback-followup") {
    return viewAutomation("/commercial-callbacks");
  }
  if (id.startsWith("ai:alert:")) {
    return notifyUser(title.slice(0, 120), description.slice(0, 500), null);
  }
  if (id === "ai:callbacks-overdue-hv-batch") {
    return viewAutomation("/commercial-callbacks");
  }

  if (id.startsWith("ai:callback-call:")) {
    const callbackId = id.slice("ai:callback-call:".length);
    if (!uuid.safeParse(callbackId).success) return null;
    const raw = phone?.replace(/\s/g, "").trim();
    if (raw) {
      return { actionType: "call_callback", payload: { callback_id: callbackId, phone: raw } };
    }
    if (canConvertCallback) {
      return { actionType: "convert_callback", payload: { callback_id: callbackId } };
    }
    return viewAutomation("/commercial-callbacks");
  }

  if (id.startsWith("ai:staffing:conf-backlog:")) {
    return notifyUser(title, description, null);
  }
  if (id.startsWith("ai:staffing:closer-pipe:")) {
    return notifyUser(title, description, null);
  }
  if (id.startsWith("ai:staffing:anomaly:")) {
    return notifyUser(title, description, null);
  }

  if (id === "ai:pipeline-unassigned") {
    return viewAutomation("/leads");
  }

  if (id.startsWith("ai:auto-assign-agent:")) {
    const rest = id.slice("ai:auto-assign-agent:".length);
    const parts = rest.split(":");
    if (parts.length !== 2) return null;
    const [workflowId, agentUserId] = parts;
    if (!uuid.safeParse(workflowId).success || !uuid.safeParse(agentUserId).success) return null;
    return {
      actionType: "assign_workflow",
      payload: { workflow_id: workflowId, assignee_user_id: agentUserId, role: "agent" },
    };
  }

  if (id.startsWith("ai:workflow-stuck-sheet:")) {
    const label = id.slice("ai:workflow-stuck-sheet:".length);
    return { actionType: "fix_sheet", payload: { label: label.slice(0, 200) } };
  }

  if (id.startsWith("ai:config-sheet:")) {
    const sheetId = id.slice("ai:config-sheet:".length);
    if (!uuid.safeParse(sheetId).success) return null;
    return { actionType: "fix_sheet", payload: { sheet_id: sheetId } };
  }

  if (id === "ai:sla-confirmateur") {
    return viewAutomation("/leads");
  }

  if (id.startsWith("ai:leads-hot-24h:")) {
    const leadId = id.slice("ai:leads-hot-24h:".length);
    if (uuid.safeParse(leadId).success) {
      return { actionType: "open_lead", payload: { lead_id: leadId } };
    }
  }
  if (id === "ai:leads-hot-24h") {
    return viewAutomation("/leads");
  }

  if (id.startsWith("ai:lead-qual:")) {
    const leadId = id.slice("ai:lead-qual:".length);
    if (!uuid.safeParse(leadId).success) return null;
    return { actionType: "open_lead", payload: { lead_id: leadId } };
  }

  if (id.startsWith("ai:lead-new-action:")) {
    const leadId = id.slice("ai:lead-new-action:".length);
    if (!uuid.safeParse(leadId).success) return null;
    return { actionType: "open_lead", payload: { lead_id: leadId } };
  }

  if (id.startsWith("ai:cash-lead:")) {
    const leadId = id.slice("ai:cash-lead:".length);
    if (!uuid.safeParse(leadId).success) return null;
    return { actionType: "open_lead", payload: { lead_id: leadId } };
  }

  return null;
}

export function buildAiActionFieldsForRecommendation(
  rec: Omit<CockpitAiRecommendation, "executable" | "actionType" | "actionPayload" | "executionStatus" | "executionMessage">,
): Pick<
  CockpitAiRecommendation,
  "executable" | "actionType" | "actionPayload" | "executionStatus" | "executionMessage"
> {
  const resolved = resolveRecommendationAction(rec.id, rec);
  if (!resolved) {
    return {
      executable: false,
      actionType: "view_automation",
      actionPayload: { redirect: "/cockpit" },
      executionStatus: "idle",
      executionMessage: null,
    };
  }
  return {
    executable: true,
    actionType: resolved.actionType,
    actionPayload: resolved.payload,
    executionStatus: "idle",
    executionMessage: null,
  };
}

export async function resolveAiActionForExecute(
  supabase: Supabase,
  recommendationId: string,
): Promise<ResolvedAiAction | null> {
  const id = recommendationId;

  if (id.startsWith("ai:callback-call:")) {
    const callbackId = id.slice("ai:callback-call:".length);
    if (!uuid.safeParse(callbackId).success) return null;
    const { data: cb } = await supabase
      .from("commercial_callbacks")
      .select("status, phone")
      .eq("id", callbackId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!cb) return null;
    const raw = cb.phone?.replace(/\s/g, "").trim() ?? "";
    if (raw) {
      return { actionType: "call_callback", payload: { callback_id: callbackId, phone: raw } };
    }
    if (!isTerminalCallbackStatus(cb.status)) {
      return { actionType: "convert_callback", payload: { callback_id: callbackId } };
    }
    return viewAutomation("/commercial-callbacks");
  }

  return resolveRecommendationAction(id, null);
}
