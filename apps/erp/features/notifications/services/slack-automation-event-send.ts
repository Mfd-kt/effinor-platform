import {
  buildSlackMessageFromEvent,
  resolveSlackWebhookForEvent,
  type SlackAutomationEventType,
  type SlackAutomationMessageInput,
} from "@/features/notifications/domain/slack-automation-routing";
import { renderSlackText } from "@/features/notifications/domain/render-slack";
import type { SlackNotificationPayload } from "@/features/notifications/domain/types";
import { sendWebhookMessage } from "@/features/notifications/infra/slack-webhook-client";
import { getSlackEnv } from "@/features/notifications/infra/slack-env";

function buildAbsoluteLeadUrl(leadId: string): string | undefined {
  const raw = (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  if (!raw) return undefined;
  const base = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return `${base}/leads/${leadId}`;
}

/**
 * Envoie un message Slack sur le(s) webhook(s) définis par `resolveSlackWebhookForEvent`.
 * À utiliser sur les transitions workflow (ex. envoi confirmateur) pour un routage métier fiable.
 */
export async function sendSlackAutomationTypedEvent(
  eventType: SlackAutomationEventType,
  message: SlackAutomationMessageInput,
  context?: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  console.log("SLACK EVENT TYPE:", eventType);

  const env = getSlackEnv();
  if (!env.enabled) {
    return { ok: false, error: "Slack désactivé." };
  }

  const msgParts = buildSlackMessageFromEvent(eventType, message);
  const routing = resolveSlackWebhookForEvent(eventType, context ?? {});

  if (!routing.ok) {
    console.warn("[notifications] sendSlackAutomationTypedEvent routing:", routing.reason, { eventType });
    return { ok: false, error: routing.reason };
  }

  const primaryChannel = routing.targets[0]?.channelKey ?? "alerts";
  const payload: SlackNotificationPayload = {
    title: msgParts.title,
    lines: msgParts.lines,
    severity: msgParts.severity,
    channelKey: primaryChannel,
    actionUrl: msgParts.actionUrl,
    actionLabel: msgParts.actionLabel,
    metadata: { slackAutomationEventType: eventType, ...context },
  };

  const text = renderSlackText(payload);
  const results = await Promise.all(
    routing.targets.map(async (t) => {
      const r = await sendWebhookMessage(t.url, { text });
      const ok = r.ok;
      console.log(
        `[notifications] Slack automation eventType=${eventType} channel=${t.channelKey} fallback=${t.usedFallback} success=${ok}`,
      );
      return { ok, channelKey: t.channelKey, error: ok ? undefined : "error" in r ? r.error : "webhook" };
    }),
  );

  const anyOk = results.some((x) => x.ok);
  if (!anyOk) {
    const err = results.find((x) => !x.ok)?.error ?? "Tous les webhooks ont échoué.";
    return { ok: false, error: err };
  }
  return { ok: true };
}

export { buildAbsoluteLeadUrl };
