import type { AiOpsDetectedIssue, AiOpsSeverity } from "../ai-ops-types";

const COOLDOWN_MS: Record<string, number> = {
  missing_fields: 4 * 3_600_000,
  batch_missing_fields: 4 * 3_600_000,
  overdue_callback: 2 * 3_600_000,
  batch_overdue_callback: 2 * 3_600_000,
  underperformance: 12 * 3_600_000,
  team_unassigned: 12 * 3_600_000,
  batch_team_unassigned: 12 * 3_600_000,
  badly_handled_lead: 4 * 3_600_000,
  batch_badly_handled_lead: 4 * 3_600_000,
  stalled_workflow: 4 * 3_600_000,
  batch_stalled_workflow: 4 * 3_600_000,
  sla_breach: 2 * 3_600_000,
  default: 3 * 3_600_000,
};

const USER_REPLY_QUIET_EXTRA_MS = 2 * 3_600_000;

type ConversationCooldownRow = {
  cooldown_until: string | null;
  last_ai_message_at: string | null;
  last_user_message_at: string | null;
  severity?: string | null;
  status?: string | null;
  snoozed_until?: string | null;
};

/**
 * Cooldown entre deux messages IA pour le même fil (hors première création).
 */
export function computeConversationCooldown(issueType: string | null, severity: AiOpsSeverity | string): number {
  const key = issueType ?? "";
  let base = COOLDOWN_MS[key] ?? COOLDOWN_MS.default;
  const sev = String(severity);
  if (sev === "critical") {
    base = Math.max(15 * 60_000, Math.floor(base / 4));
  } else if (sev === "high") {
    base = Math.max(30 * 60_000, Math.floor(base / 2));
  }
  return base;
}

export function isConversationInCooldown(conv: ConversationCooldownRow, nowMs: number): boolean {
  if (conv.cooldown_until) {
    const t = new Date(conv.cooldown_until).getTime();
    if (nowMs < t) return true;
  }
  return false;
}

export type LatestIssueState = Pick<AiOpsDetectedIssue, "severity" | "priority" | "issueType">;

/**
 * Peut-on envoyer un message de suivi IA ? (anti–relance toutes les 5 min.)
 */
export function canSendAiFollowUp(
  conv: ConversationCooldownRow,
  latestIssueState: LatestIssueState,
  nowMs: number,
): { ok: boolean; reason?: string } {
  if (conv.status === "snoozed" && conv.snoozed_until) {
    const until = new Date(conv.snoozed_until).getTime();
    if (nowMs < until) {
      const sev = String(latestIssueState.severity ?? "info");
      if (sev !== "critical") {
        return { ok: false, reason: "snoozed" };
      }
    }
  }

  if (isConversationInCooldown(conv, nowMs)) {
    const sev = String(latestIssueState.severity ?? "info");
    if (sev !== "critical") {
      return { ok: false, reason: "cooldown_until" };
    }
  }

  const lastAi = conv.last_ai_message_at ? new Date(conv.last_ai_message_at).getTime() : null;
  if (lastAi != null) {
    const needGap = computeConversationCooldown(latestIssueState.issueType ?? null, latestIssueState.severity ?? "info");
    let gap = needGap;
    const lastUser = conv.last_user_message_at ? new Date(conv.last_user_message_at).getTime() : null;
    if (lastUser != null && lastUser > lastAi) {
      gap += USER_REPLY_QUIET_EXTRA_MS;
    }
    if (nowMs - lastAi < gap) {
      const sev = String(latestIssueState.severity ?? "info");
      if (sev !== "critical") {
        return { ok: false, reason: "min_gap_since_last_ai" };
      }
    }
  }

  return { ok: true };
}
