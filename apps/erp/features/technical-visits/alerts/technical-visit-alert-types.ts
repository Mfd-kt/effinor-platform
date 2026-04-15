/** Types d’alerte gérés par la synchronisation automatique (hors alertes purement manuelles). */
export const TECHNICAL_VISIT_SYNCED_ALERT_TYPES = [
  "visit_missing_geo_proof",
  "geo_far_from_site",
  "geo_refused",
  "geo_unavailable",
  "site_coords_missing",
  "audio_transcription_failed",
  "audio_transcription_stale",
  "visit_sparse_field_report",
] as const;

export type TechnicalVisitSyncedAlertType = (typeof TECHNICAL_VISIT_SYNCED_ALERT_TYPES)[number];

export type TechnicalVisitAlertSeverity = "info" | "warning" | "critical";

export type TechnicalVisitAlertDesired = {
  alertType: TechnicalVisitSyncedAlertType;
  severity: TechnicalVisitAlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

/** Durée au-delà de laquelle une note restée en « transcribing » est considérée bloquée. */
export const TECHNICAL_VISIT_AUDIO_STALE_MS = 15 * 60 * 1000;

/** Longueur minimale pour considérer qu’il existe un texte terrain « exploitable ». */
export const TECHNICAL_VISIT_MIN_REPORT_CHARS = 10;
