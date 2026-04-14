/**
 * Couche domaine — notifications transverses (Slack phase 1, autres canaux ensuite).
 */

export const NOTIFICATION_CHANNEL_KEYS = [
  "commercial",
  "administratif",
  "technique",
  "finance",
  "direction",
  "alerts",
  "closer",
  "confirmateur",
] as const;

export type NotificationChannelKey = (typeof NOTIFICATION_CHANNEL_KEYS)[number];

export const NOTIFICATION_SEVERITIES = ["info", "success", "warning", "critical"] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

/** Payload normalisé pour rendu Slack (texte ou blocks). */
export type SlackNotificationPayload = {
  title: string;
  body?: string;
  lines?: string[];
  severity: NotificationSeverity;
  channelKey: NotificationChannelKey;
  metadata?: Record<string, unknown>;
  /** Lien absolu ou chemin app (préfixé par APP_URL côté service si relatif). */
  actionUrl?: string;
  actionLabel?: string;
};

export type DomainNotificationEvent = {
  type: string;
  entityType: string;
  entityId: string;
  severity: NotificationSeverity;
  payload: SlackNotificationPayload;
  createdAt: string;
};

export type NotificationLogStatus = "sent" | "failed" | "skipped";

export type NotificationProvider = "slack";
