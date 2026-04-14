import type { SlaInstanceStatus } from "./sla-types";

/**
 * État SLA à partir des trois jalons (Europe/Paris pour l’affichage ; instants en UTC).
 * healthy → warning → breached → critical
 */
export function evaluateSlaState(
  warningDueAt: Date,
  targetDueAt: Date,
  criticalDueAt: Date,
  now: Date,
): SlaInstanceStatus {
  const t = now.getTime();
  if (t < warningDueAt.getTime()) return "healthy";
  if (t < targetDueAt.getTime()) return "warning";
  if (t < criticalDueAt.getTime()) return "breached";
  return "critical";
}
