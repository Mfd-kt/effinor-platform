export function isInternalSlaEnabled(): boolean {
  const v = process.env.AI_INTERNAL_SLA_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isInternalSlaAutonomousMode(): boolean {
  const v = process.env.AI_INTERNAL_SLA_AUTONOMOUS_MODE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isInternalSlaManagerAlertsEnabled(): boolean {
  const v = process.env.AI_INTERNAL_SLA_MANAGER_ALERTS?.trim().toLowerCase();
  if (!v) return true;
  return v === "1" || v === "true" || v === "yes";
}

export function isInternalSlaDirectionAlertsEnabled(): boolean {
  const v = process.env.AI_INTERNAL_SLA_DIRECTION_ALERTS?.trim().toLowerCase();
  if (!v) return true;
  return v === "1" || v === "true" || v === "yes";
}
