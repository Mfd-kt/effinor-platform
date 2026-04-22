import {
  isCallbackDueToday,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { computeCommercialCallbackScore } from "@/features/commercial-callbacks/lib/callback-scoring";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

import type { InternalSlaRuleRow } from "./sla-types";

function asRecord(j: unknown): Record<string, unknown> {
  return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : {};
}

function num(x: unknown, d: number): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : d;
}

type CallbackLite = Pick<
  CommercialCallbackRow,
  | "id"
  | "status"
  | "priority"
  | "callback_date"
  | "callback_time"
  | "estimated_value_eur"
  | "business_score"
  | "created_at"
>;

type LeadLite = {
  id: string;
  lead_status: string;
  simulated_at: string | null;
  sim_saving_eur_30_selected: number | null;
  created_by_agent_id: string | null;
};

type WorkflowLite = {
  id: string;
  workflow_status: string;
  agreement_sent_at: string | null;
  updated_at: string;
};

/**
 * Indique si l’entité correspond encore aux critères de la règle (sinon résolution SLA).
 */
export function entityStillMatchesSlaRule(
  rule: InternalSlaRuleRow,
  entity: CallbackLite | LeadLite | WorkflowLite | { id: string },
  now: Date,
): boolean {
  const cond = asRecord(rule.condition_json);

  if (rule.entity_type === "callback" && "status" in entity) {
    const cb = entity as CallbackLite;
    if (isTerminalCallbackStatus(cb.status)) return false;

    if (rule.code === "cb_critical_2h") {
      const minScore = num(cond.min_business_score, 75);
      const minEur = num(cond.min_value_eur, 8000);
      const pri = String(cb.priority).toLowerCase() === "critical";
      const { businessScore } = computeCommercialCallbackScore(cb as CommercialCallbackRow, now);
      const eur = cb.estimated_value_eur ?? 0;
      return pri || businessScore >= minScore || eur >= minEur;
    }

    if (rule.code === "cb_due_today_eod") {
      return isCallbackDueToday(cb.status, cb.callback_date, cb.callback_time, now);
    }

    return false;
  }

  if (rule.entity_type === "lead" && "lead_status" in entity) {
    const L = entity as LeadLite;
    if (rule.code !== "lead_sim_1h") return false;
    const wantStatus = String(cond.lead_status ?? "new");
    if (L.lead_status !== wantStatus) return false;
    if (!L.simulated_at) return false;
    const minSav = num(cond.min_savings_eur, 1);
    const sav = L.sim_saving_eur_30_selected ?? 0;
    return sav >= minSav;
  }

  if (rule.entity_type === "workflow" && "workflow_status" in entity) {
    const w = entity as WorkflowLite;
    if (rule.code === "wf_closer_48h") {
      const any = cond.workflow_status_any;
      const statuses = Array.isArray(any) ? any.map(String) : ["to_close", "agreement_sent"];
      return statuses.includes(w.workflow_status);
    }
    return false;
  }

  if (rule.entity_type === "user") {
    return false;
  }

  return false;
}
