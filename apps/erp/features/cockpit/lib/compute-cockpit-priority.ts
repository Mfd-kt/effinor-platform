/** Score unique pour trier actions, anomalies et cash (plus haut = plus prioritaire). */
export function computeCockpitPriority(input: {
  valueCents: number;
  overdue?: boolean;
  callbackScore?: number;
  isBlocked?: boolean;
  automationFailure?: boolean;
  backlogCount?: number;
}): number {
  let p = 0;
  p += Math.min(2_000_000, input.valueCents) / 500;
  if (input.overdue) p += 12_000;
  if (input.callbackScore != null) p += input.callbackScore * 35;
  if (input.isBlocked) p += 4_000;
  if (input.automationFailure) p += 15_000;
  if (input.backlogCount != null) p += Math.min(50_000, input.backlogCount * 400);
  return Math.round(p);
}
