export type SlackWebhookEnvMap = {
  default: string | undefined;
  commercial: string | undefined;
  admin: string | undefined;
  technique: string | undefined;
  finance: string | undefined;
  direction: string | undefined;
  alerts: string | undefined;
  closer: string | undefined;
};

export type SlackEnv = {
  enabled: boolean;
  webhooks: SlackWebhookEnvMap;
  botToken: string | undefined;
  defaultChannel: string | undefined;
};

let cached: SlackEnv | null = null;

function readEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v === "" || v === undefined ? undefined : v;
}

function parseEnabled(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/**
 * Lecture unique (avec cache) des variables Slack. Ne lance jamais : valeurs manquantes = undefined.
 */
export function getSlackEnv(): SlackEnv {
  if (cached) return cached;

  cached = {
    enabled: parseEnabled(readEnv("SLACK_ENABLED")),
    webhooks: {
      default: readEnv("SLACK_DEFAULT_WEBHOOK_URL"),
      commercial: readEnv("SLACK_COMMERCIAL_WEBHOOK_URL"),
      admin: readEnv("SLACK_ADMIN_WEBHOOK_URL"),
      technique: readEnv("SLACK_TECHNIQUE_WEBHOOK_URL"),
      finance: readEnv("SLACK_FINANCE_WEBHOOK_URL"),
      direction: readEnv("SLACK_DIRECTION_WEBHOOK_URL"),
      alerts: readEnv("SLACK_ALERTS_WEBHOOK_URL"),
      closer: readEnv("SLACK_CLOSER_WEBHOOK_URL"),
    },
    botToken: readEnv("SLACK_BOT_TOKEN"),
    defaultChannel: readEnv("SLACK_DEFAULT_CHANNEL"),
  };

  return cached;
}

/** Invalide le cache (tests). */
export function resetSlackEnvCache(): void {
  cached = null;
}
