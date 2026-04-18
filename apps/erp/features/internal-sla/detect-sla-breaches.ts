import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database.types";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import {
  isCallbackDueToday,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { firstInstantOfParisYmd } from "@/lib/datetime/paris-day";

import { computeSlaDueDatesForEntity } from "./compute-sla-instance";
import { evaluateSlaState } from "./evaluate-sla-state";
import { entityStillMatchesSlaRule } from "./resolve-sla-instance";
import { getActiveSlaRules } from "./sla-rules";
import type { InternalSlaRuleRow, SlaInstanceStatus, SlaLogEventType } from "./sla-types";
import { executeSlaSideEffects } from "./sla-actions";

type Admin = SupabaseClient<Database>;

function asRecord(j: unknown): Record<string, unknown> {
  return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : {};
}

function num(x: unknown, d: number): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : d;
}

async function logSla(
  admin: Admin,
  input: {
    instanceId: string | null;
    ruleCode: string;
    entityType: string;
    entityId: string;
    severity: string;
    eventType: SlaLogEventType;
    payload?: Json;
  },
): Promise<void> {
  await admin.from("internal_sla_logs").insert({
    sla_instance_id: input.instanceId,
    rule_code: input.ruleCode,
    entity_type: input.entityType,
    entity_id: input.entityId,
    severity: input.severity,
    event_type: input.eventType,
    payload_json: (input.payload ?? {}) as Json,
  });
}

function eventTypeForStatus(s: SlaInstanceStatus): SlaLogEventType | null {
  if (s === "warning") return "warning";
  if (s === "breached") return "breached";
  if (s === "critical") return "critical";
  if (s === "resolved") return "resolved";
  return null;
}

async function getConfirmAnchor(admin: Admin, workflowId: string): Promise<Date> {
  const { data } = await admin
    .from("workflow_event_logs")
    .select("created_at")
    .eq("workflow_id", workflowId)
    .eq("to_status", "to_confirm")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data?.created_at) return new Date(data.created_at);
  const { data: w } = await admin.from("lead_sheet_workflows").select("updated_at").eq("id", workflowId).maybeSingle();
  return w?.updated_at ? new Date(w.updated_at) : new Date();
}

async function getCloserAnchor(admin: Admin, w: {
  id: string;
  workflow_status: string;
  agreement_sent_at: string | null;
  updated_at: string;
}): Promise<Date> {
  if (w.workflow_status === "agreement_sent" && w.agreement_sent_at) {
    return new Date(w.agreement_sent_at);
  }
  const { data } = await admin
    .from("workflow_event_logs")
    .select("created_at")
    .eq("workflow_id", w.id)
    .eq("event_type", "sent_to_closer")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data?.created_at) return new Date(data.created_at);
  return new Date(w.updated_at);
}

type StockAgent = {
  agentId: string;
  managerId: string | null;
  anchor: Date;
  openCount: number;
};

async function buildUserStockCandidates(admin: Admin, rule: InternalSlaRuleRow, now: Date): Promise<StockAgent[]> {
  const cond = asRecord(rule.condition_json);
  const minStock = num(cond.min_open_stock, 3);
  const staleHours = num(cond.stale_hours, 72);
  const staleMs = staleHours * 3_600_000;

  const { data: cbs } = await admin
    .from("commercial_callbacks")
    .select("id, assigned_agent_user_id, created_at, updated_at, status")
    .is("deleted_at", null)
    .limit(4000);
  const { data: leads } = await admin
    .from("leads")
    .select("id, created_by_agent_id, created_at, lead_status")
    .is("deleted_at", null)
    .eq("lead_status", "new")
    .limit(3000);

  const byAgent = new Map<
    string,
    { times: number[]; count: number }
  >();

  for (const r of cbs ?? []) {
    if (!r.assigned_agent_user_id) continue;
    if (isTerminalCallbackStatus(r.status)) continue;
    const t = Math.min(new Date(r.created_at).getTime(), new Date(r.updated_at).getTime());
    const e = byAgent.get(r.assigned_agent_user_id) ?? { times: [], count: 0 };
    e.times.push(t);
    e.count += 1;
    byAgent.set(r.assigned_agent_user_id, e);
  }
  for (const L of leads ?? []) {
    if (!L.created_by_agent_id) continue;
    const t = new Date(L.created_at).getTime();
    const e = byAgent.get(L.created_by_agent_id) ?? { times: [], count: 0 };
    e.times.push(t);
    e.count += 1;
    byAgent.set(L.created_by_agent_id, e);
  }

  const out: StockAgent[] = [];
  const nowMs = now.getTime();

  for (const [agentId, { times, count }] of byAgent) {
    if (count < minStock) continue;
    const oldest = Math.min(...times);
    if (nowMs - oldest < staleMs) continue;

    let managerId: string | null = null;
    const { data: agentTeam } = await admin
      .from("cee_sheet_team_members")
      .select("cee_sheet_team_id")
      .eq("user_id", agentId)
      .eq("role_in_team", "agent")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    const tid = agentTeam?.cee_sheet_team_id;
    if (tid) {
      const { data: mgr } = await admin
        .from("cee_sheet_team_members")
        .select("user_id")
        .eq("cee_sheet_team_id", tid)
        .eq("role_in_team", "manager")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      managerId = mgr?.user_id ?? null;
    }
    if (!managerId) continue;

    out.push({ agentId, managerId, anchor: new Date(oldest), openCount: count });
  }

  return out;
}

export type DetectSlaBreachesResult = {
  checked: number;
  created: number;
  warning: number;
  breached: number;
  critical: number;
  resolved: number;
  escalated: number;
};

export async function detectSlaBreaches(admin: Admin, now: Date): Promise<DetectSlaBreachesResult> {
  const rules = await getActiveSlaRules(admin);
  const result: DetectSlaBreachesResult = {
    checked: 0,
    created: 0,
    warning: 0,
    breached: 0,
    critical: 0,
    resolved: 0,
    escalated: 0,
  };
  if (!rules.length) return result;

  type UpsertPayload = {
    rule: InternalSlaRuleRow;
    entityType: string;
    entityId: string;
    assignedUserId: string | null;
    managerUserId: string | null;
    anchor: Date;
    callbackDate?: string;
    meta: Record<string, unknown>;
  };

  const toUpsert: UpsertPayload[] = [];

  for (const rule of rules) {
    if (rule.entity_type === "callback") {
      const { data: rows } = await admin.from("commercial_callbacks").select("*").is("deleted_at", null).limit(3500);
      for (const row of rows ?? []) {
        const cb = row as CommercialCallbackRow;
        if (!entityStillMatchesSlaRule(rule, cb, now)) continue;
        let anchor = new Date(cb.created_at);
        let callbackDate: string | undefined;
        if (rule.code === "cb_due_today_eod") {
          if (!isCallbackDueToday(cb.status, cb.callback_date, cb.callback_time, now)) continue;
          callbackDate = cb.callback_date;
          if (!callbackDate) continue;
          anchor = new Date(firstInstantOfParisYmd(callbackDate));
        } else if (rule.code === "cb_critical_2h") {
          anchor = new Date(cb.created_at);
        } else continue;

        const dues = computeSlaDueDatesForEntity(rule, anchor, { callbackDate });
        if (!dues) continue;
        toUpsert.push({
          rule,
          entityType: "callback",
          entityId: cb.id,
          assignedUserId: cb.assigned_agent_user_id,
          managerUserId: null,
          anchor,
          callbackDate,
          meta: { company: cb.company_name, dues, rule_code: rule.code },
        });
      }
    }

    if (rule.entity_type === "lead" && rule.code === "lead_sim_1h") {
      const { data: rows } = await admin
        .from("leads")
        .select("id, lead_status, simulated_at, sim_saving_eur_30_selected, created_by_agent_id, company_name")
        .is("deleted_at", null)
        .limit(2500);
      for (const L of rows ?? []) {
        if (!entityStillMatchesSlaRule(rule, L, now)) continue;
        if (!L.simulated_at || !L.created_by_agent_id) continue;
        const anchor = new Date(L.simulated_at);
        toUpsert.push({
          rule,
          entityType: "lead",
          entityId: L.id,
          assignedUserId: L.created_by_agent_id,
          managerUserId: null,
          anchor,
          meta: { company: L.company_name, rule_code: rule.code },
        });
      }
    }

    if (rule.entity_type === "workflow") {
      const { data: rows } = await admin
        .from("lead_sheet_workflows")
        .select("id, lead_id, workflow_status, agreement_sent_at, updated_at, assigned_confirmateur_user_id, assigned_closer_user_id")
        .eq("is_archived", false)
        .neq("workflow_status", "lost")
        .limit(2000);
      for (const w of rows ?? []) {
        if (!entityStillMatchesSlaRule(rule, w, now)) continue;
        let anchor: Date;
        let assignee: string | null = null;
        if (rule.code === "wf_confirmateur_24h") {
          anchor = await getConfirmAnchor(admin, w.id);
          assignee = w.assigned_confirmateur_user_id;
        } else if (rule.code === "wf_closer_48h") {
          anchor = await getCloserAnchor(admin, w);
          assignee = w.assigned_closer_user_id;
        } else continue;
        if (!assignee) continue;
        toUpsert.push({
          rule,
          entityType: "workflow",
          entityId: w.id,
          assignedUserId: assignee,
          managerUserId: null,
          anchor,
          meta: { lead_id: w.lead_id, workflow_status: w.workflow_status, rule_code: rule.code },
        });
      }
    }

    if (rule.entity_type === "user" && rule.code === "user_stock_inactive_manager") {
      const stocks = await buildUserStockCandidates(admin, rule, now);
      for (const s of stocks) {
        toUpsert.push({
          rule,
          entityType: "user",
          entityId: s.agentId,
          assignedUserId: s.managerId,
          managerUserId: s.managerId,
          anchor: s.anchor,
          meta: { open_count: s.openCount, agent_id: s.agentId, rule_code: rule.code },
        });
      }
    }
  }

  const activeKeys = new Set<string>();
  for (const u of toUpsert) {
    const key = `${u.rule.code}:${u.entityType}:${u.entityId}`;
    activeKeys.add(key);
  }

  const { data: existingRows } = await admin
    .from("internal_sla_instances")
    .select("*")
    .in("status", ["healthy", "warning", "breached", "critical"])
    .limit(5000);

  for (const inst of existingRows ?? []) {
    const key = `${inst.rule_code}:${inst.entity_type}:${inst.entity_id}`;
    if (activeKeys.has(key)) continue;
    const rule = rules.find((r) => r.code === inst.rule_code);
    if (!rule) continue;

    let still = false;
    if (inst.entity_type === "callback") {
      const { data: row } = await admin.from("commercial_callbacks").select("*").eq("id", inst.entity_id).maybeSingle();
      if (row) still = entityStillMatchesSlaRule(rule, row as CommercialCallbackRow, now);
    } else if (inst.entity_type === "lead") {
      const { data: row } = await admin.from("leads").select("*").eq("id", inst.entity_id).maybeSingle();
      if (row) still = entityStillMatchesSlaRule(rule, row, now);
    } else if (inst.entity_type === "workflow") {
      const { data: row } = await admin.from("lead_sheet_workflows").select("*").eq("id", inst.entity_id).maybeSingle();
      if (row) still = entityStillMatchesSlaRule(rule, row, now);
    } else if (inst.entity_type === "user") {
      const stocks = await buildUserStockCandidates(admin, rule, now);
      still = stocks.some((s) => s.agentId === inst.entity_id);
    }

    if (!still) {
      await admin
        .from("internal_sla_instances")
        .update({
          status: "resolved",
          resolved_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", inst.id);
      result.resolved += 1;
      await logSla(admin, {
        instanceId: inst.id,
        ruleCode: inst.rule_code,
        entityType: inst.entity_type,
        entityId: inst.entity_id,
        severity: "resolved",
        eventType: "resolved",
        payload: { reason: "entity_no_longer_matches" } as Json,
      });
    }
  }

  for (const u of toUpsert) {
    result.checked += 1;
    const dues = computeSlaDueDatesForEntity(u.rule, u.anchor, { callbackDate: u.callbackDate });
    if (!dues) continue;

    const { data: existing } = await admin
      .from("internal_sla_instances")
      .select("*")
      .eq("rule_code", u.rule.code)
      .eq("entity_type", u.entityType)
      .eq("entity_id", u.entityId)
      .in("status", ["healthy", "warning", "breached", "critical"])
      .maybeSingle();

    const nextStatus = evaluateSlaState(dues.warningDueAt, dues.targetDueAt, dues.criticalDueAt, now);
    const metadata = {
      ...u.meta,
      anchor_label: dues.anchorLabel,
      anchor_iso: dues.anchorIso,
      warning_due_at: dues.warningDueAt.toISOString(),
      target_due_at: dues.targetDueAt.toISOString(),
      critical_due_at: dues.criticalDueAt.toISOString(),
    } as Record<string, unknown>;

    if (!existing) {
      const { data: inserted, error } = await admin
        .from("internal_sla_instances")
        .insert({
          rule_code: u.rule.code,
          entity_type: u.entityType,
          entity_id: u.entityId,
          assigned_user_id: u.assignedUserId,
          manager_user_id: u.managerUserId,
          warning_due_at: dues.warningDueAt.toISOString(),
          target_due_at: dues.targetDueAt.toISOString(),
          critical_due_at: dues.criticalDueAt.toISOString(),
          status: nextStatus,
          last_checked_at: now.toISOString(),
          metadata_json: metadata as Json,
        })
        .select("id")
        .single();
      if (error || !inserted) continue;
      result.created += 1;
      await logSla(admin, {
        instanceId: inserted.id,
        ruleCode: u.rule.code,
        entityType: u.entityType,
        entityId: u.entityId,
        severity: nextStatus,
        eventType: "created",
        payload: { status: nextStatus } as Json,
      });
      if (nextStatus === "warning") result.warning += 1;
      else if (nextStatus === "breached") result.breached += 1;
      else if (nextStatus === "critical") result.critical += 1;

      const esc = await executeSlaSideEffects(admin, {
        instanceId: inserted.id,
        rule: u.rule,
        status: nextStatus,
        entityType: u.entityType,
        entityId: u.entityId,
        assignedUserId: u.assignedUserId,
        managerUserId: u.managerUserId,
        metadata,
        now,
      });
      result.escalated += esc.escalatedCount;
      continue;
    }

    const prev = existing.status as SlaInstanceStatus;
    await admin
      .from("internal_sla_instances")
      .update({
        warning_due_at: dues.warningDueAt.toISOString(),
        target_due_at: dues.targetDueAt.toISOString(),
        critical_due_at: dues.criticalDueAt.toISOString(),
        status: nextStatus,
        assigned_user_id: u.assignedUserId,
        manager_user_id: u.managerUserId ?? existing.manager_user_id,
        last_checked_at: now.toISOString(),
        metadata_json: metadata as Json,
        updated_at: now.toISOString(),
      })
      .eq("id", existing.id);

    if (prev !== nextStatus) {
      const ev = eventTypeForStatus(nextStatus);
      if (ev) {
        await logSla(admin, {
          instanceId: existing.id,
          ruleCode: u.rule.code,
          entityType: u.entityType,
          entityId: u.entityId,
          severity: nextStatus,
          eventType: ev,
          payload: { from: prev, to: nextStatus } as Json,
        });
      }
      if (nextStatus === "warning") result.warning += 1;
      else if (nextStatus === "breached") result.breached += 1;
      else if (nextStatus === "critical") result.critical += 1;

      const esc = await executeSlaSideEffects(admin, {
        instanceId: existing.id,
        rule: u.rule,
        status: nextStatus,
        entityType: u.entityType,
        entityId: u.entityId,
        assignedUserId: u.assignedUserId,
        managerUserId: u.managerUserId,
        metadata,
        now,
      });
      result.escalated += esc.escalatedCount;
    }
  }

  return result;
}
