/** Taux en baisse anormal (current vs previous), en points (0–1). */
export function isDropAnomalous(
  currentRate: number,
  previousRate: number,
  warningDelta: number,
  criticalDelta: number,
): "ok" | "warning" | "critical" {
  if (previousRate <= 0) return "ok";
  const delta = previousRate - currentRate;
  if (delta >= criticalDelta) return "critical";
  if (delta >= warningDelta) return "warning";
  return "ok";
}

/** Taux strictement sous un seuil (0–1). */
export function isRateBelowThreshold(
  rate: number | null,
  warningThreshold: number,
  criticalThreshold: number,
): "ok" | "warning" | "critical" {
  if (rate == null) return "ok";
  if (rate < criticalThreshold) return "critical";
  if (rate < warningThreshold) return "warning";
  return "ok";
}

export function isBacklogCritical(count: number, warning: number, critical: number): "ok" | "warning" | "critical" {
  if (count >= critical) return "critical";
  if (count >= warning) return "warning";
  return "ok";
}

/** Baisse relative (%) current vs previous. */
export function relativeDropPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((previous - current) / previous) * 1000) / 10;
}

export function activityDropSeverity(
  current: number,
  previous: number,
  warnPct: number,
  critPct: number,
  minPrevious: number,
): "ok" | "warning" | "critical" {
  if (previous < minPrevious) return "ok";
  const drop = relativeDropPct(current, previous);
  if (drop == null) return "ok";
  if (drop >= critPct) return "critical";
  if (drop >= warnPct) return "warning";
  return "ok";
}

/** Hausse du taux de perte (points, 0–1) vs période précédente. */
export function lossRateJumpSeverity(
  currentRate: number | null,
  previousRate: number | null,
  warnJump: number,
  critJump: number,
): "ok" | "warning" | "critical" {
  if (currentRate == null || previousRate == null) return "ok";
  const jump = currentRate - previousRate;
  if (jump >= critJump) return "critical";
  if (jump >= warnJump) return "warning";
  return "ok";
}
