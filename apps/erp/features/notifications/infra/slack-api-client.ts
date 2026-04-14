/**
 * Client Slack Web API — phase 2 (chat.postMessage, blocks, boutons).
 * Squelette : implémenter quand SLACK_BOT_TOKEN sera utilisé en prod.
 */

export type SlackApiPostMessagePayload = {
  channel: string;
  text?: string;
  blocks?: Record<string, unknown>[];
};

export type SlackApiResult = { ok: true } | { ok: false; error: string };

export async function postMessage(
  _botToken: string,
  _payload: SlackApiPostMessagePayload,
): Promise<SlackApiResult> {
  return {
    ok: false,
    error:
      "Slack Bot API non activée : définir SLACK_BOT_TOKEN et implémenter chat.postMessage (phase 2).",
  };
}
