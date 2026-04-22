import type { Json } from "@/types/database.types";

export type SlaEntityType = "callback" | "lead" | "workflow" | "team" | "user";

export type SlaRoleTarget = "agent" | "closer" | "manager" | "direction" | "system" | "commercial";

export type SlaActionPolicy =
  | "notify"
  | "escalate_manager"
  | "escalate_direction"
  | "auto_reassign"
  | "create_task";

export type SlaInstanceStatus = "healthy" | "warning" | "breached" | "critical" | "resolved";

export type SlaLogEventType =
  | "created"
  | "warning"
  | "breached"
  | "critical"
  | "resolved"
  | "escalated"
  | "action_taken";

export type InternalSlaRuleRow = {
  code: string;
  name: string;
  entity_type: string;
  role_target: string;
  condition_json: Json;
  target_delay_minutes: number;
  warning_delay_minutes: number;
  critical_delay_minutes: number;
  action_policy: string;
  is_active: boolean;
};

export type SlaDueDates = {
  warningDueAt: Date;
  targetDueAt: Date;
  criticalDueAt: Date;
  anchorIso: string;
  anchorLabel: string;
};
