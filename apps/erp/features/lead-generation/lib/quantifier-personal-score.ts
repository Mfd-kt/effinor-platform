import {
  PRIME_BONUS_PER_QUALIFIED_WHEN_ABOVE_THRESHOLD,
  PRIME_BONUS_QUALIFY_RATE_THRESHOLD_PERCENT,
  PRIME_EUR_PER_ACCORD,
  PRIME_EUR_PER_INSTALLATION,
  PRIME_EUR_PER_QUALIFIED,
  PRIME_EUR_PER_RDV,
  PRIME_EUR_PER_VT,
} from "./quantifier-personal-dashboard-config";
import type { BusinessOutcomeCounts } from "../queries/get-lead-generation-management-business-outcomes";
import type { QuantifierManagementRow } from "../queries/get-lead-generation-management-dashboard";

/** Bonus volume léger : +1 point max tous les 4 qualifications plafonné à 12. */
const VOLUME_POINT_EVERY = 4;
const VOLUME_BONUS_CAP = 12;

export type QuantifierScoreBadge = "excellent" | "good" | "warn" | "low";

export function quantifierVolumeBonusPoints(qualifiedEventsInPeriod: number): number {
  return Math.min(VOLUME_BONUS_CAP, Math.floor(qualifiedEventsInPeriod / VOLUME_POINT_EVERY));
}

/**
 * Score 0–100 : taux de qualification − taux de retour + bonus volume (sur la fenêtre passée en entrée).
 */
export function quantifierPerformanceScore100(q: {
  qualifyRatePercent: number | null;
  returnRatePercent: number | null;
  qualifiedEventsInPeriod: number;
}): number {
  const qRate = q.qualifyRatePercent ?? 0;
  const rRate = q.returnRatePercent ?? 0;
  const raw = qRate - rRate + quantifierVolumeBonusPoints(q.qualifiedEventsInPeriod);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function quantifierScoreBadge(score: number): QuantifierScoreBadge {
  if (score >= 80) {
    return "excellent";
  }
  if (score >= 60) {
    return "good";
  }
  if (score >= 40) {
    return "warn";
  }
  return "low";
}

export type WorkQualityBadge = "high" | "mid" | "low";

/** Faible taux de retour commercial = meilleure qualité perçue. */
export function workQualityBadge(returnRatePercent: number | null): WorkQualityBadge {
  if (returnRatePercent == null) {
    return "mid";
  }
  if (returnRatePercent <= 12) {
    return "high";
  }
  if (returnRatePercent <= 24) {
    return "mid";
  }
  return "low";
}

export function estimateQuantifierPrimeEur(input: {
  qualifiedEventsInPeriod: number;
  qualifyRatePercent: number | null;
  business: BusinessOutcomeCounts;
}): number {
  const q = input.qualifiedEventsInPeriod;
  let eur = q * PRIME_EUR_PER_QUALIFIED;
  if (
    input.qualifyRatePercent != null &&
    input.qualifyRatePercent >= PRIME_BONUS_QUALIFY_RATE_THRESHOLD_PERCENT
  ) {
    eur += q * PRIME_BONUS_PER_QUALIFIED_WHEN_ABOVE_THRESHOLD;
  }
  eur += input.business.withRdv * PRIME_EUR_PER_RDV;
  eur += input.business.withAccord * PRIME_EUR_PER_ACCORD;
  eur += input.business.withVt * PRIME_EUR_PER_VT;
  eur += input.business.withInstallation * PRIME_EUR_PER_INSTALLATION;
  return Math.round(eur * 100) / 100;
}

export function pickQuantifierRow(
  rows: QuantifierManagementRow[],
  userId: string,
): QuantifierManagementRow | null {
  return rows.find((r) => r.userId === userId) ?? null;
}
