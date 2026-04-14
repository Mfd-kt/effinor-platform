const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 1;

export type WebhookSendResult =
  | { ok: true; status: number }
  | { ok: false; error: string; status?: number };

/**
 * Envoie un message JSON sur une URL Incoming Webhook Slack.
 * Ne jette pas : retourne un résultat structuré (dégradation gracieuse).
 */
export async function sendWebhookMessage(
  webhookUrl: string,
  body: Record<string, unknown>,
  options?: { timeoutMs?: number },
): Promise<WebhookSendResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!webhookUrl.startsWith("https://")) {
    return { ok: false, error: "URL webhook invalide (https requis)." };
  }

  let lastErr = "Échec inconnu";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        return { ok: true, status: res.status };
      }

      const errText = await res.text().catch(() => "");
      lastErr = `HTTP ${res.status}${errText ? `: ${errText.slice(0, 200)}` : ""}`;

      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
        return { ok: false, error: lastErr, status: res.status };
      }
    } catch (e) {
      clearTimeout(timer);
      lastErr = e instanceof Error ? e.message : String(e);
      if (attempt === MAX_RETRIES) {
        return { ok: false, error: lastErr };
      }
    }
  }

  return { ok: false, error: lastErr };
}
