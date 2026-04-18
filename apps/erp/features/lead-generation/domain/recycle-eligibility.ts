/** Codes stables stockés en `recycle_reason` (étape 16). */
export type LeadGenerationRecycleReasonCode =
  | "ASSIGNED_NOT_OPENED_STALE"
  | "ACTIVE_NO_ACTIVITY_STALE"
  | "FOLLOW_UP_OVERDUE"
  | "TOO_MANY_ATTEMPTS_WITHOUT_PROGRESS";

export const LEAD_GENERATION_RECYCLE_REASON_LABELS: Record<LeadGenerationRecycleReasonCode, string> = {
  ASSIGNED_NOT_OPENED_STALE: "Attribuée mais jamais ouverte (délai dépassé)",
  ACTIVE_NO_ACTIVITY_STALE: "Plus d’activité commerciale récente",
  FOLLOW_UP_OVERDUE: "Relance prévue dépassée",
  TOO_MANY_ATTEMPTS_WITHOUT_PROGRESS: "Nombre d’essais élevé sans avancée",
};

/** Statut recyclage sur l’assignation (CHECK SQL). */
export type LeadGenerationAssignmentRecycleStatus = "active" | "eligible" | "recycled" | "closed";
