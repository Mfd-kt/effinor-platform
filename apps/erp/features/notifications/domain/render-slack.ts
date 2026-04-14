import type { SlackNotificationPayload } from "@/features/notifications/domain/types";

const SEVERITY_EMOJI: Record<SlackNotificationPayload["severity"], string> = {
  info: ":information_source:",
  success: ":white_check_mark:",
  warning: ":warning:",
  critical: ":rotating_light:",
};

/**
 * Rendu texte pour webhooks Incoming (compatibilité maximale).
 */
export function renderSlackText(payload: SlackNotificationPayload): string {
  const emoji = SEVERITY_EMOJI[payload.severity] ?? ":bell:";
  const parts: string[] = [`${emoji} *${escapeSlackMrkdwn(payload.title)}*`];

  if (payload.body?.trim()) {
    parts.push("", escapeSlackMrkdwn(payload.body.trim()));
  }

  if (payload.lines?.length) {
    for (const line of payload.lines) {
      if (line.trim()) parts.push(escapeSlackMrkdwn(line.trim()));
    }
  }

  if (payload.actionUrl?.trim() && payload.actionLabel?.trim()) {
    parts.push("", `👉 <${payload.actionUrl.trim()}|${escapeSlackMrkdwn(payload.actionLabel.trim())}>`);
  } else if (payload.actionUrl?.trim()) {
    parts.push("", `👉 ${payload.actionUrl.trim()}`);
  }

  return parts.join("\n");
}

function escapeSlackMrkdwn(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Préparation future : messages enrichis (blocks) pour chat.postMessage ou webhooks avancés. */
export function renderSlackBlocks(payload: SlackNotificationPayload): {
  blocks: Record<string, unknown>[];
  text: string;
} {
  const text = renderSlackText(payload);
  const blocks: Record<string, unknown>[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text,
      },
    },
  ];
  return { blocks, text };
}
