import type { Database } from "@/types/database.types";

import type { AiOpsDetectedIssue, AiOpsPriority, AiOpsSeverity } from "../ai-ops-types";

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  warning: 2,
  info: 3,
};

export function computeAiOpsSeverity(issue: AiOpsDetectedIssue): AiOpsSeverity {
  if (issue.severity) return issue.severity;

  let score = 0;
  if (issue.priority === "critical") score += 3;
  else if (issue.priority === "high") score += 2;
  else if (issue.priority === "normal") score += 1;

  const v = issue.estimatedValueEur ?? 0;
  if (v >= 20_000) score += 2;
  else if (v >= 5_000) score += 1;

  if (issue.issueType.includes("overdue") || issue.issueType === "batch_overdue_callback") score += 2;
  if (issue.issueType.includes("stalled") || issue.issueType === "batch_stalled_workflow") score += 1;
  if (issue.issueType === "sla_breach") score += 2;

  if (score >= 5) return "critical";
  if (score >= 3) return "high";
  if (score >= 1) return "warning";
  return "info";
}

export function computeAiOpsPriority(issue: AiOpsDetectedIssue): AiOpsPriority {
  const sev = computeAiOpsSeverity(issue);
  if (sev === "critical") return "critical";
  if (sev === "high") return "high";
  if (issue.priority === "high" || issue.priority === "critical") return issue.priority;
  const v = issue.estimatedValueEur ?? 0;
  if (v >= 15_000) return "high";
  return issue.priority;
}

export type ConversationSortRow = Pick<
  Database["public"]["Tables"]["ai_conversations"]["Row"],
  "priority" | "severity" | "updated_at" | "status"
>;

export function rankAiOpsConversations<T extends ConversationSortRow>(conversations: T[]): T[] {
  return [...conversations].sort((a, b) => {
    const sp = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    if (sp !== 0) return sp;
    const ss = (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
    if (ss !== 0) return ss;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function mergePriorities(a: AiOpsPriority, b: AiOpsPriority): AiOpsPriority {
  const order: AiOpsPriority[] = ["low", "normal", "high", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? "normal";
}

export function mergeSeverities(a: AiOpsSeverity, b: AiOpsSeverity): AiOpsSeverity {
  const order: AiOpsSeverity[] = ["info", "warning", "high", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? "info";
}
