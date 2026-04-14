import type { AiOpsDetectedIssue } from "../ai-ops-types";

/** Fenêtre minimale avant réouverture après résolution (réutilise la même ligne + reopen_count). */
export const AI_OPS_REOPEN_AFTER_RESOLVED_MS = 7 * 24 * 3_600_000;

type ConversationLike = {
  id: string;
  status: string;
  snoozed_until: string | null;
  updated_at: string;
  resolved_at: string | null;
  dedupe_key: string | null;
};

/**
 * Clé stable : un problème sur un même objet pour un même utilisateur → une conversation.
 */
export function buildAiOpsDedupeKey(issue: AiOpsDetectedIssue): string {
  if (issue.dedupeKey?.trim()) return issue.dedupeKey.trim();
  const u = issue.targetUserId;
  switch (issue.issueType) {
    case "missing_fields":
      return issue.entityId
        ? `missing_fields:lead:${issue.entityId}:${u}`
        : `missing_fields:user:${u}`;
    case "batch_missing_fields":
      return `batch:missing_fields:${u}`;
    case "overdue_callback":
      return issue.entityId ? `overdue_callback:${issue.entityId}:${u}` : `overdue_callback:user:${u}`;
    case "batch_overdue_callback":
      return `batch:overdue_callback:${u}`;
    case "stalled_workflow":
      return issue.entityId ? `stalled_workflow:${issue.entityId}:${u}` : `stalled_workflow:user:${u}`;
    case "batch_stalled_workflow":
      return `batch:stalled_workflow:${u}`;
    case "badly_handled_lead":
      return issue.entityId ? `badly_handled_lead:${issue.entityId}:${u}` : `badly_handled_lead:user:${u}`;
    case "batch_badly_handled_lead":
      return `batch:badly_handled_lead:${u}`;
    case "team_unassigned":
      return issue.entityId ? `team_unassigned:${issue.entityId}:${u}` : `team_unassigned:user:${u}`;
    case "batch_team_unassigned":
      return `batch:team_unassigned:${u}`;
    case "sla_breach":
      if (issue.entityType && issue.entityId && issue.metadataJson && typeof issue.metadataJson === "object") {
        const code = (issue.metadataJson as Record<string, unknown>).rule_code;
        if (typeof code === "string" && code) {
          return `sla:${code}:${issue.entityType}:${issue.entityId}:${u}`;
        }
      }
      return issue.entityId ? `sla:breach:${issue.entityId}:${u}` : `sla:breach:user:${u}`;
    default:
      return `generic:${issue.issueType}:${issue.entityId ?? "none"}:${u}`;
  }
}

export function findOpenConversationByDedupeKey(
  rows: ConversationLike[] | null | undefined,
  dedupeKey: string,
): ConversationLike | null {
  if (!rows?.length) return null;
  return rows.find((r) => r.dedupe_key === dedupeKey) ?? null;
}

/**
 * Réutiliser la ligne existante si le même dedupe_key et statut « actif » ou réouvrable.
 */
export function shouldReuseExistingConversation(
  existing: ConversationLike,
  issue: AiOpsDetectedIssue,
  nowMs: number,
): boolean {
  const k = buildAiOpsDedupeKey(issue);
  if (existing.dedupe_key !== k) return false;

  if (existing.status === "resolved") {
    const resolvedAt = existing.resolved_at ? new Date(existing.resolved_at).getTime() : null;
    const fallback = new Date(existing.updated_at).getTime();
    const base = resolvedAt ?? fallback;
    return nowMs - base >= AI_OPS_REOPEN_AFTER_RESOLVED_MS;
  }

  if (existing.status === "auto_closed") {
    return nowMs - new Date(existing.updated_at).getTime() >= AI_OPS_REOPEN_AFTER_RESOLVED_MS;
  }

  if (existing.status === "snoozed") {
    const until = existing.snoozed_until ? new Date(existing.snoozed_until).getTime() : null;
    if (until != null && nowMs < until) {
      return true;
    }
    return true;
  }

  return (
    existing.status === "open" ||
    existing.status === "awaiting_user" ||
    existing.status === "escalated"
  );
}

/**
 * Ouvrir / réécrire une conversation pour ce sujet (nouveau message IA autorisé côté métier).
 */
export function shouldOpenNewConversation(
  issue: AiOpsDetectedIssue,
  existing: ConversationLike | null,
  nowMs: number,
): boolean {
  if (!existing) return true;
  if (existing.status === "resolved" || existing.status === "auto_closed") {
    const resolvedAt = existing.resolved_at ? new Date(existing.resolved_at).getTime() : null;
    const base = resolvedAt ?? new Date(existing.updated_at).getTime();
    return nowMs - base >= AI_OPS_REOPEN_AFTER_RESOLVED_MS;
  }
  return true;
}
