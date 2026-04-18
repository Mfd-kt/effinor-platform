import type { LeadGenerationRecycleReasonCode } from "../domain/recycle-eligibility";
import type { RecyclingRulesSettings } from "../settings/default-settings";

/** Jours sans ouverture après attribution (règle A). */
export const DAYS_ASSIGNED_WITHOUT_OPEN = 7;

/** Jours sans activité significative après dernier contact enregistré (règle B). */
export const DAYS_SILENCE_AFTER_LAST_TOUCH = 14;

/** Seuil de tentatives (appels / emails comptés côté assignation) pour règle D. */
export const MIN_ATTEMPTS_FOR_RECYCLE = 12;

const DEFAULT_RULES: RecyclingRulesSettings = {
  days_assigned_without_open: DAYS_ASSIGNED_WITHOUT_OPEN,
  days_silence_after_last_touch: DAYS_SILENCE_AFTER_LAST_TOUCH,
  min_attempts_for_recycle: MIN_ATTEMPTS_FOR_RECYCLE,
};

const MS_PER_DAY = 86_400_000;

export type AssignmentSnapshotForRecycle = {
  assignment_status: string;
  outcome: string;
  created_lead_id: string | null;
  assigned_at: string;
  opened_at: string | null;
  last_activity_at: string | null;
  attempt_count: number;
};

export type ActivityTouchForRecycle = {
  next_action_at: string | null;
};

function ms(iso: string): number {
  return new Date(iso).getTime();
}

function nowMs(): number {
  return Date.now();
}

/**
 * Détermine si le stock empêche tout recyclage métier (fiche terminée / convertie).
 */
export function isStockTerminalForRecycle(stockStatus: string, convertedLeadId: string | null): boolean {
  if (convertedLeadId) {
    return true;
  }
  return stockStatus === "converted" || stockStatus === "rejected" || stockStatus === "archived" || stockStatus === "expired";
}

/**
 * Assignation terminée : plus de suivi recyclage possible.
 */
export function isAssignmentTerminalForRecycle(a: AssignmentSnapshotForRecycle): boolean {
  if (a.created_lead_id) {
    return true;
  }
  if (a.outcome !== "pending") {
    return true;
  }
  if (a.assignment_status === "consumed" || a.assignment_status === "expired" || a.assignment_status === "recycled") {
    return true;
  }
  return false;
}

export type ComputeRecycleEligibilityResult = {
  isEligible: boolean;
  /** Code stable ; null si non éligible. */
  recycleReason: LeadGenerationRecycleReasonCode | null;
  /** Horodatage « à partir de quand » l’éligibilité est constatée (évaluation = maintenant). */
  recycleEligibleAt: string | null;
};

/**
 * Règles explicites, évaluées dans l’ordre : A → C → B → D.
 * Prérequis : assignation et stock non terminaux (sinon appeler après filtrage ou obtenir isEligible false).
 */
export function computeLeadGenerationRecycleEligibility(input: {
  assignment: AssignmentSnapshotForRecycle;
  stockStatus: string;
  stockConvertedLeadId: string | null;
  activities: ActivityTouchForRecycle[];
  rules?: RecyclingRulesSettings;
}): ComputeRecycleEligibilityResult {
  const { assignment: a, stockStatus, stockConvertedLeadId, activities, rules = DEFAULT_RULES } = input;

  if (isStockTerminalForRecycle(stockStatus, stockConvertedLeadId) || isAssignmentTerminalForRecycle(a)) {
    return { isEligible: false, recycleReason: null, recycleEligibleAt: null };
  }

  const t = nowMs();
  const assignedMs = ms(a.assigned_at);
  const lastTouchMs = a.last_activity_at
    ? ms(a.last_activity_at)
    : a.opened_at
      ? ms(a.opened_at)
      : assignedMs;

  // A — Jamais ouverte, attribution ancienne
  if (
    a.assignment_status === "assigned" &&
    !a.opened_at &&
    t - assignedMs >= rules.days_assigned_without_open * MS_PER_DAY
  ) {
    return eligible("ASSIGNED_NOT_OPENED_STALE");
  }

  // C — Relance prévue dépassée
  const overdueFollowUp = activities.some((row) => {
    if (!row.next_action_at) {
      return false;
    }
    return ms(row.next_action_at) < t;
  });
  if (overdueFollowUp) {
    return eligible("FOLLOW_UP_OVERDUE");
  }

  // B — Inactivité prolongée
  if (t - lastTouchMs >= rules.days_silence_after_last_touch * MS_PER_DAY) {
    return eligible("ACTIVE_NO_ACTIVITY_STALE");
  }

  // D — Trop de tentatives sans conversion (signal proxy)
  if (a.attempt_count >= rules.min_attempts_for_recycle) {
    return eligible("TOO_MANY_ATTEMPTS_WITHOUT_PROGRESS");
  }

  return { isEligible: false, recycleReason: null, recycleEligibleAt: null };
}

function eligible(code: LeadGenerationRecycleReasonCode): ComputeRecycleEligibilityResult {
  return {
    isEligible: true,
    recycleReason: code,
    recycleEligibleAt: new Date().toISOString(),
  };
}
