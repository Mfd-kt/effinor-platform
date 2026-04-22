import type { SupabaseClient } from "@supabase/supabase-js";

import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import {
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { fetchCommercialCallbacksForAgentWorkstation } from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";
import { getManagedTeamsContext } from "@/features/dashboard/queries/get-managed-teams-context";
import type { AccessContext } from "@/lib/auth/access-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { getParisDayRangeIso } from "@/lib/datetime/paris-day";

import type { RoleDigestTarget } from "./digest-types";

type Admin = SupabaseClient<Database>;

export type WorkflowDigestRow = {
  id: string;
  lead_id: string;
  workflow_status: string;
  updated_at: string;
  agreement_sent_at: string | null;
  assigned_closer_user_id: string | null;
};

export type SlaInstanceDigestRow = {
  id: string;
  rule_code: string;
  entity_type: string;
  entity_id: string;
  status: string;
  target_due_at: string;
  assigned_user_id: string | null;
  manager_user_id: string | null;
};

export type AiOpsBrief = {
  openConversations: number;
  escalatedCount: number;
};

export type RoleDigestLoaderSnapshot = {
  roleTarget: RoleDigestTarget;
  userId: string;
  now: Date;
  /** Agent */
  agentCallbacks?: CommercialCallbackRow[];
  agentHotLeads?: Array<{
    id: string;
    company_name: string;
    phone: string | null;
    simulated_at: string | null;
    sim_saving_eur_30_selected: number | null;
  }>;
  /** Closer */
  closerPipeline?: WorkflowDigestRow[];
  closerStaleAgreements?: WorkflowDigestRow[];
  closerHighCallbacks?: CommercialCallbackRow[];
  /** Manager */
  managedTeamIds?: string[];
  managedMemberIds?: string[];
  managerSla?: SlaInstanceDigestRow[];
  /** Direction */
  directionLeadsToday?: number;
  directionAutomationFailed48h?: number;
  directionSlaCritical?: number;
  directionHighValueOverdue?: number;
  directionSheetsWithoutTeam?: number;
  directionAiExecutedToday?: number;
  directionUnassignedWorkflows?: number;
  aiOpsBrief?: AiOpsBrief;
};

async function loadAiOpsBrief(admin: Admin, userId: string): Promise<AiOpsBrief> {
  const { count: open } = await admin
    .from("ai_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["open", "awaiting_user", "escalated", "snoozed"]);
  const { count: esc } = await admin
    .from("ai_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "escalated");
  return {
    openConversations: open ?? 0,
    escalatedCount: esc ?? 0,
  };
}

export async function loadRoleDigestData(
  access: AccessContext,
  roleTarget: RoleDigestTarget,
  now: Date,
): Promise<RoleDigestLoaderSnapshot | null> {
  if (access.kind !== "authenticated") return null;
  const userId = access.userId;
  const supabase = await createClient();
  const base: RoleDigestLoaderSnapshot = { roleTarget, userId, now };

  if (roleTarget === "agent") {
    const agentCallbacks = await fetchCommercialCallbacksForAgentWorkstation(access);
    const { data: leads } = await supabase
      .from("leads")
      .select("id, company_name, phone, simulated_at, sim_saving_eur_30_selected")
      .eq("created_by_agent_id", userId)
      .eq("lead_status", "new")
      .is("deleted_at", null)
      .order("simulated_at", { ascending: false, nullsFirst: false })
      .limit(12);
    const admin = createAdminClient();
    const aiOpsBrief = await loadAiOpsBrief(admin, userId);
    return {
      ...base,
      agentCallbacks,
      agentHotLeads: leads ?? [],
      aiOpsBrief,
    };
  }

  if (roleTarget === "closer") {
    const { data: pipe } = await supabase
      .from("lead_sheet_workflows")
      .select(
        "id, lead_id, workflow_status, updated_at, agreement_sent_at, assigned_closer_user_id",
      )
      .eq("assigned_closer_user_id", userId)
      .in("workflow_status", ["to_close", "agreement_sent"])
      .eq("is_archived", false)
      .order("updated_at", { ascending: true })
      .limit(35);
    const rows = (pipe ?? []) as WorkflowDigestRow[];
    const staleMs = 48 * 3_600_000;
    const stale = rows.filter(
      (w) =>
        w.workflow_status === "agreement_sent" &&
        w.agreement_sent_at &&
        now.getTime() - new Date(w.agreement_sent_at).getTime() > staleMs,
    );
    const cbs = await fetchCommercialCallbacksForAgentWorkstation(access);
    const nonTerm = cbs.filter((c) => !isTerminalCallbackStatus(c.status));
    const hotCb = nonTerm
      .filter((c) => (c.estimated_value_eur ?? 0) >= 5000 || isCallbackOverdue(c.status, c.callback_date, c.callback_time, now))
      .slice(0, 5);
    const admin = createAdminClient();
    const aiOpsBrief = await loadAiOpsBrief(admin, userId);
    return {
      ...base,
      closerPipeline: rows,
      closerStaleAgreements: stale,
      closerHighCallbacks: hotCb,
      aiOpsBrief,
    };
  }

  if (roleTarget === "manager") {
    const ctx = await getManagedTeamsContext(userId);
    if (!ctx) return { ...base, managedTeamIds: [], managedMemberIds: [], aiOpsBrief: await loadAiOpsBrief(createAdminClient(), userId) };
    const memberIds = [...new Set(ctx.members.filter((m) => m.isActive).map((m) => m.userId))];
    const { data: sla } = await supabase
      .from("internal_sla_instances")
      .select("id, rule_code, entity_type, entity_id, status, target_due_at, assigned_user_id, manager_user_id")
      .eq("manager_user_id", userId)
      .in("status", ["warning", "breached", "critical"])
      .limit(25);
    const admin = createAdminClient();
    const aiOpsBrief = await loadAiOpsBrief(admin, userId);
    return {
      ...base,
      managedTeamIds: ctx.teamIds,
      managedMemberIds: memberIds,
      managerSla: (sla ?? []) as SlaInstanceDigestRow[],
      aiOpsBrief,
    };
  }

  if (roleTarget === "direction") {
    const admin = createAdminClient();
    const { startIso } = getParisDayRangeIso(now);
    const since48 = new Date(now.getTime() - 48 * 3_600_000).toISOString();
    const startUtcDay = new Date(now);
    startUtcDay.setUTCHours(0, 0, 0, 0);

    const [{ count: leadsToday }, { count: autoFail }, { count: slaCrit }, { count: unassigned }, { count: noTeamWf }] =
      await Promise.all([
        admin.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startIso).is("deleted_at", null),
        admin
          .from("automation_logs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("created_at", since48),
        admin
          .from("internal_sla_instances")
          .select("id", { count: "exact", head: true })
          .eq("status", "critical"),
        admin
          .from("lead_sheet_workflows")
          .select("id", { count: "exact", head: true })
          .is("assigned_agent_user_id", null)
          .eq("is_archived", false)
          .neq("workflow_status", "lost"),
        admin
          .from("lead_sheet_workflows")
          .select("id", { count: "exact", head: true })
          .is("cee_sheet_team_id", null)
          .eq("is_archived", false)
          .neq("workflow_status", "lost"),
      ]);

    const { data: callbacks } = await admin
      .from("commercial_callbacks")
      .select("id, status, callback_date, callback_time, estimated_value_eur, company_name")
      .is("deleted_at", null)
      .limit(400);
    let hvOverdue = 0;
    for (const c of callbacks ?? []) {
      if (isTerminalCallbackStatus(c.status)) continue;
      const v = c.estimated_value_eur ?? 0;
      if (v < 8000) continue;
      if (isCallbackOverdue(c.status, c.callback_date, c.callback_time, now)) hvOverdue += 1;
    }

    const { count: aiToday } = await admin
      .from("ai_action_logs")
      .select("id", { count: "exact", head: true })
      .eq("executed_by", "ai")
      .eq("status", "success")
      .gte("created_at", startUtcDay.toISOString());

    const aiOpsBrief = await loadAiOpsBrief(admin, userId);

    return {
      ...base,
      directionLeadsToday: leadsToday ?? 0,
      directionAutomationFailed48h: autoFail ?? 0,
      directionSlaCritical: slaCrit ?? 0,
      directionHighValueOverdue: hvOverdue,
      directionSheetsWithoutTeam: noTeamWf ?? 0,
      directionAiExecutedToday: aiToday ?? 0,
      directionUnassignedWorkflows: unassigned ?? 0,
      aiOpsBrief,
    };
  }

  return base;
}
