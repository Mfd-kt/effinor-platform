import {
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

type Admin = SupabaseClient<Database>;

type ConvRow = Pick<
  Database["public"]["Tables"]["ai_conversations"]["Row"],
  "issue_type" | "metadata_json" | "issue_entity_id" | "entity_id"
>;

function relatedFromMetadata(meta: unknown): Array<{ type: string; id: string }> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  const r = (meta as Record<string, unknown>).related_entities;
  if (!Array.isArray(r)) return [];
  return r
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const o = x as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : null;
      if (!id) return null;
      return { type: typeof o.type === "string" ? o.type : "entity", id };
    })
    .filter(Boolean) as Array<{ type: string; id: string }>;
}

/**
 * Indique si le problème lié à la conversation est encore d’actualité (pour auto-résolution).
 */
export async function isAiConversationIssueStillActive(
  admin: Admin,
  conv: ConvRow,
  now: Date,
): Promise<boolean> {
  const type = conv.issue_type ?? "";
  const meta = conv.metadata_json;

  if (type === "sla_breach") {
    if (meta && typeof meta === "object" && !Array.isArray(meta)) {
      const sid = (meta as Record<string, unknown>).sla_instance_id;
      if (typeof sid === "string" && sid) {
        const { data } = await admin.from("internal_sla_instances").select("status").eq("id", sid).maybeSingle();
        if (!data) return false;
        return data.status !== "resolved";
      }
    }
    return true;
  }

  if (type.startsWith("batch_") || (meta && relatedFromMetadata(meta).length > 0)) {
    const rel = relatedFromMetadata(meta);
    if (!rel.length) return true;
    for (const ref of rel) {
      const active = await isSingleEntityIssueActive(admin, ref.type, ref.id, now);
      if (active) return true;
    }
    return false;
  }

  const eid = conv.issue_entity_id ?? conv.entity_id;
  if (!eid) {
    return type === "team_unassigned";
  }

  return isSingleEntityIssueActive(admin, type, eid, now);
}

async function isSingleEntityIssueActive(
  admin: Admin,
  issueType: string,
  entityId: string,
  now: Date,
): Promise<boolean> {
  if (issueType.includes("callback") || issueType === "overdue_callback" || issueType === "batch_overdue_callback") {
    const { data: r } = await admin
      .from("commercial_callbacks")
      .select("id, status, callback_date, callback_time, estimated_value_eur")
      .eq("id", entityId)
      .maybeSingle();
    if (!r) return false;
    if (isTerminalCallbackStatus(r.status)) return false;
    const overdue = isCallbackOverdue(r.status, r.callback_date, r.callback_time, now);
    const dueToday = !overdue && isCallbackDueToday(r.status, r.callback_date, r.callback_time, now);
    const highValue = (r.estimated_value_eur ?? 0) >= 5_000 || overdue;
    return (overdue || dueToday) && highValue;
  }

  if (
    issueType.includes("badly_handled") ||
    issueType === "badly_handled_lead" ||
    issueType === "batch_badly_handled_lead"
  ) {
    const { data: L } = await admin
      .from("leads")
      .select("id, created_at, simulated_at, lead_status")
      .eq("id", entityId)
      .maybeSingle();
    if (!L || L.lead_status !== "new") return false;
    const created = new Date(L.created_at).getTime();
    const ageMs = now.getTime() - created;
    const ms24h = 24 * 3_600_000;
    const simAt = L.simulated_at ? new Date(L.simulated_at).getTime() : null;
    const hoursSinceSim = simAt != null ? (now.getTime() - simAt) / 3_600_000 : null;
    if (simAt != null && hoursSinceSim != null && hoursSinceSim >= 12) return true;
    if (ageMs >= ms24h) return true;
    return false;
  }

  if (
    issueType.includes("stalled") ||
    issueType === "stalled_workflow" ||
    issueType === "batch_stalled_workflow"
  ) {
    const { data: w } = await admin
      .from("lead_sheet_workflows")
      .select("id, assigned_agent_user_id, workflow_status")
      .eq("id", entityId)
      .maybeSingle();
    if (!w) return false;
    if (w.workflow_status === "lost") return false;
    return w.assigned_agent_user_id == null;
  }

  if (issueType.includes("missing_fields") || issueType === "missing_fields" || issueType === "batch_missing_fields") {
    const { data: L } = await admin
      .from("leads")
      .select("id, company_name, phone, head_office_city, lead_status")
      .eq("id", entityId)
      .maybeSingle();
    if (!L || L.lead_status === "lost") return false;
    const missing: string[] = [];
    if (!L.company_name?.trim()) missing.push("raison sociale");
    if (!L.phone?.trim()) missing.push("téléphone");
    if (!L.head_office_city?.trim()) missing.push("ville siège");
    return missing.length >= 2;
  }

  if (issueType === "team_unassigned") {
    const { data: wfs } = await admin
      .from("lead_sheet_workflows")
      .select("id")
      .eq("cee_sheet_team_id", entityId)
      .is("assigned_agent_user_id", null)
      .neq("workflow_status", "lost")
      .limit(5);
    return (wfs?.length ?? 0) >= 2;
  }

  return true;
}
