import type { DomainNotificationEvent, SlackNotificationPayload } from "@/features/notifications/domain/types";
import { renderSlackText } from "@/features/notifications/domain/render-slack";
import { resolveSlackWebhookUrl } from "@/features/notifications/domain/routing";
import { getSlackEnv } from "@/features/notifications/infra/slack-env";
import { sendWebhookMessage } from "@/features/notifications/infra/slack-webhook-client";
import { insertNotificationLog } from "@/features/notifications/services/notification-log-service";

export type SlackSendOutcome =
  | { status: "sent"; usedFallback: boolean }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

/**
 * Envoi principal vers Slack (webhook). Ne lance pas d’exception vers l’appelant métier.
 */
export async function sendSlackNotification(
  payload: SlackNotificationPayload,
  meta?: { eventType?: string; entityType?: string; entityId?: string },
): Promise<SlackSendOutcome> {
  const env = getSlackEnv();
  if (!env.enabled) {
    await insertNotificationLog({
      channel: payload.channelKey,
      provider: "slack",
      status: "skipped",
      eventType: meta?.eventType,
      entityType: meta?.entityType,
      entityId: meta?.entityId,
      payloadJson: { title: payload.title, severity: payload.severity },
      errorMessage: "Slack désactivé",
    });
    return { status: "skipped", reason: "SLACK_ENABLED is off" };
  }

  const resolved = resolveSlackWebhookUrl(payload.channelKey);
  if (!resolved.ok) {
    console.warn("[notifications]", resolved.reason);
    await insertNotificationLog({
      channel: payload.channelKey,
      provider: "slack",
      status: "skipped",
      eventType: meta?.eventType,
      entityType: meta?.entityType,
      entityId: meta?.entityId,
      payloadJson: { title: payload.title },
      errorMessage: resolved.reason,
    });
    return { status: "skipped", reason: resolved.reason };
  }

  const text = renderSlackText(payload);
  const body: Record<string, unknown> = { text };

  const result = await sendWebhookMessage(resolved.url, body);
  if (result.ok) {
    await insertNotificationLog({
      channel: payload.channelKey,
      provider: "slack",
      status: "sent",
      eventType: meta?.eventType,
      entityType: meta?.entityType,
      entityId: meta?.entityId,
      payloadJson: {
        title: payload.title,
        severity: payload.severity,
        webhookFallback: resolved.usedFallback,
      },
    });
    return { status: "sent", usedFallback: resolved.usedFallback };
  }

  const errMsg = "error" in result ? result.error : "Erreur webhook";
  console.warn("[notifications] Slack webhook failed:", errMsg);
  await insertNotificationLog({
    channel: payload.channelKey,
    provider: "slack",
    status: "failed",
    eventType: meta?.eventType,
    entityType: meta?.entityType,
    entityId: meta?.entityId,
    payloadJson: { title: payload.title },
    errorMessage: errMsg,
  });
  return { status: "failed", error: errMsg };
}

export async function notifyDomainEvent(event: DomainNotificationEvent): Promise<SlackSendOutcome> {
  return sendSlackNotification(event.payload, {
    eventType: event.type,
    entityType: event.entityType,
    entityId: event.entityId,
  });
}
