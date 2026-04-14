import type { NotificationChannelKey } from "@/features/notifications/domain/types";

export type AutomationType =
  | "slack_smart_alert"
  | "auto_assign_confirmateur"
  | "auto_assign_closer"
  | "ai_follow_up_draft"
  | "ai_follow_up_sent"
  | "ai_follow_up_scheduled"
  | "rebalance_assignments"
  | "ai_orchestrator_tick"
  | "ai_orchestrator_report";

export type AutomationLogStatus = "success" | "skipped" | "failed";

export type SlackSmartAlertKind =
  | "cockpit_critical"
  | "cockpit_urgent_high_impact"
  | "cockpit_staffing"
  | "cockpit_configuration"
  | "cockpit_followup_backlog"
  | "cockpit_cash_signal";

export type SlackSmartAlertBuildInput = {
  kind: SlackSmartAlertKind;
  dedupeKey: string;
  title: string;
  bodyLines: string[];
  channelKey: NotificationChannelKey;
  severity: "critical" | "warning" | "info";
  actionUrl: string;
  actionLabel: string;
  /** Référence cockpit (ex. id d’alerte). */
  sourceAlertId?: string;
};

export type AutomationRuleDecision = {
  ruleId: string;
  slack: boolean;
  slackReason: string;
  /** Signal « cash » : priorité urgente + fort enjeu €. */
  immediateCashSignal: boolean;
};
