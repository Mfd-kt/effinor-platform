import type { RoleDigestPriority } from "./digest-types";

const RANK: Record<RoleDigestPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

export function rankPriority(p: RoleDigestPriority): number {
  return RANK[p] ?? 1;
}

export function coercePriorityFromSignals(input: {
  overdueCount: number;
  criticalCount: number;
  slaBreached: number;
  automationFailures: number;
}): RoleDigestPriority {
  if (input.criticalCount > 0 || input.slaBreached >= 3 || input.automationFailures >= 5) return "critical";
  if (input.overdueCount >= 2 || input.slaBreached >= 1 || input.automationFailures >= 2) return "high";
  if (input.overdueCount >= 1 || input.criticalCount > 0) return "normal";
  return "low";
}
