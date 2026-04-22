import type { NotificationChannelKey } from "@/features/notifications/domain/types";
import { getSlackEnv } from "@/features/notifications/infra/slack-env";

export type WebhookResolution =
  | { ok: true; url: string; usedFallback: boolean }
  | { ok: false; reason: string };

/**
 * Résout l’URL de webhook Slack pour un canal métier.
 * Fallback : SLACK_DEFAULT_WEBHOOK_URL si le canal dédié est vide.
 */
export function resolveSlackWebhookUrl(channelKey: NotificationChannelKey): WebhookResolution {
  const env = getSlackEnv();
  if (!env.enabled) {
    return { ok: false, reason: "Slack désactivé (SLACK_ENABLED=false)." };
  }

  const map: Record<NotificationChannelKey, string | undefined> = {
    commercial: env.webhooks.commercial,
    administratif: env.webhooks.admin,
    technique: env.webhooks.technique,
    finance: env.webhooks.finance,
    direction: env.webhooks.direction,
    alerts: env.webhooks.alerts,
    closer: env.webhooks.closer,
  };

  const specific = map[channelKey]?.trim();
  if (specific) {
    return { ok: true, url: specific, usedFallback: false };
  }

  const fallback = env.webhooks.default?.trim();
  if (fallback) {
    return { ok: true, url: fallback, usedFallback: true };
  }

  return {
    ok: false,
    reason: `Aucune URL webhook pour le canal « ${channelKey} » et SLACK_DEFAULT_WEBHOOK_URL vide.`,
  };
}
