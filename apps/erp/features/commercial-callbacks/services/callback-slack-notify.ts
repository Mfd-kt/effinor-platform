import { SlackEventType } from "@/features/notifications/domain/slack-events";
import * as T from "@/features/notifications/domain/templates";
import { sendSlackNotification } from "@/features/notifications/services/slack-notification-service";

function slackCallbacksEnabled(): boolean {
  return process.env.COMMERCIAL_CALLBACK_SLACK_ENABLED === "true";
}

/**
 * Point d’entrée pour futur cron / automation : rappel dû aujourd’hui.
 * Inactif tant que `COMMERCIAL_CALLBACK_SLACK_ENABLED` n’est pas à `true`.
 */
export async function notifyCallbackDueToday(payload: {
  companyName: string;
  contactName: string;
  phone: string;
  callbackId: string;
  callbackDate: string;
}): Promise<void> {
  if (!slackCallbacksEnabled()) return;
  const p = T.templateCallbackDueToday(payload);
  await sendSlackNotification(p, {
    eventType: SlackEventType.CALLBACK_DUE_TODAY,
    entityType: "commercial_callback",
    entityId: payload.callbackId,
  });
}

/**
 * Point d’entrée pour futur cron : rappel en retard.
 */
export async function notifyCallbackOverdue(payload: {
  companyName: string;
  contactName: string;
  phone: string;
  callbackId: string;
  callbackDate: string;
}): Promise<void> {
  if (!slackCallbacksEnabled()) return;
  const p = T.templateCallbackOverdue(payload);
  await sendSlackNotification(p, {
    eventType: SlackEventType.CALLBACK_OVERDUE,
    entityType: "commercial_callback",
    entityId: payload.callbackId,
  });
}
