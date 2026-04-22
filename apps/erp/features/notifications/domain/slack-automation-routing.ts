import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import type { NotificationChannelKey, NotificationSeverity, SlackNotificationPayload } from "@/features/notifications/domain/types";
import { resolveSlackWebhookUrl } from "@/features/notifications/domain/routing";
import { getSlackEnv } from "@/features/notifications/infra/slack-env";

/** Types d’événements métier pour le routage Slack (automation / cockpit). */
export const SLACK_AUTOMATION_EVENT_TYPES = [
  "new_lead",
  "lead_contacted",
  "docs_missing",
  "send_to_closer",
  "closing_followup",
  "deal_signed",
  "critical_alert",
  "sheet_misconfigured",
  "no_team_member",
  "vt_created",
  "vt_updated",
] as const;

export type SlackAutomationEventType = (typeof SLACK_AUTOMATION_EVENT_TYPES)[number];

export type SlackWebhookTarget = {
  url: string;
  channelKey: NotificationChannelKey;
  usedFallback: boolean;
};

export type SlackWebhookForEventResult =
  | { ok: true; targets: SlackWebhookTarget[] }
  | { ok: false; reason: string };

const EVENT_TO_CHANNELS: Record<SlackAutomationEventType, NotificationChannelKey[]> = {
  new_lead: ["commercial"],
  lead_contacted: ["commercial"],
  docs_missing: ["administratif"],
  send_to_closer: ["closer"],
  closing_followup: ["closer"],
  deal_signed: ["commercial", "direction"],
  critical_alert: ["direction"],
  sheet_misconfigured: ["direction"],
  no_team_member: ["direction"],
  vt_created: ["technique"],
  vt_updated: ["technique"],
};

/**
 * Résout une ou plusieurs URLs de webhook Slack pour un type d’événement.
 * Déduplique les URLs identiques. Si aucune URL dédiée n’est configurée, utilise SLACK_DEFAULT_WEBHOOK_URL.
 */
export function resolveSlackWebhookForEvent(
  eventType: SlackAutomationEventType,
  _context?: Record<string, unknown>,
): SlackWebhookForEventResult {
  const env = getSlackEnv();
  if (!env.enabled) {
    return { ok: false, reason: "Slack désactivé (SLACK_ENABLED=false)." };
  }

  const channelKeys = EVENT_TO_CHANNELS[eventType];
  if (!channelKeys?.length) {
    return { ok: false, reason: `Type d’événement inconnu : ${String(eventType)}` };
  }

  const targets: SlackWebhookTarget[] = [];
  const seenUrls = new Set<string>();

  for (const channelKey of channelKeys) {
    const resolved = resolveSlackWebhookUrl(channelKey);
    if (!resolved.ok) {
      continue;
    }
    if (seenUrls.has(resolved.url)) {
      continue;
    }
    seenUrls.add(resolved.url);
    targets.push({
      url: resolved.url,
      channelKey,
      usedFallback: resolved.usedFallback,
    });
  }

  if (targets.length > 0) {
    return { ok: true, targets };
  }

  const fallback = env.webhooks.default?.trim();
  if (fallback) {
    return {
      ok: true,
      targets: [{ url: fallback, channelKey: "alerts", usedFallback: true }],
    };
  }

  return {
    ok: false,
    reason: `Aucun webhook configuré pour « ${eventType} » et SLACK_DEFAULT_WEBHOOK_URL vide.`,
  };
}

/** Masque les statuts / codes techniques de workflow dans les textes visibles Slack. */
export function sanitizeSlackVisibleText(text: string): string {
  let s = text;
  const replacements: [RegExp, string][] = [
    [/\bdraft\b/gi, "brouillon"],
    [/\bsimulation_done\b/gi, "simulation validée"],
    [/\bqualified\b/gi, "qualifié"],
    [/\bto_closer\b/gi, "transmission closer"],
    [/\bclosed\b/gi, "clôturé"],
  ];
  for (const [re, label] of replacements) {
    s = s.replace(re, label);
  }
  return s.replace(/\s+/g, " ").trim();
}

export type SlackAutomationMessageInput = {
  companyName?: string | null;
  actionRequired?: string | null;
  erpUrl?: string | null;
  actionLabel?: string | null;
  /** Lignes déjà rédigées (ex. détail cockpit), seront sanitizées. */
  detailLines?: string[];
};

/**
 * Construit titre + lignes pour Slack (titres clairs, pas de statuts internes bruts).
 */
export function buildSlackMessageFromEvent(
  eventType: SlackAutomationEventType,
  payload: SlackAutomationMessageInput,
): Pick<SlackNotificationPayload, "title" | "lines" | "severity" | "actionUrl" | "actionLabel"> {
  const company = payload.companyName?.trim() || "Société non renseignée";
  const titleByEvent: Record<SlackAutomationEventType, string> = {
    new_lead: "Nouveau lead",
    lead_contacted: "Lead contacté",
    docs_missing: "Documents manquants ou en retard",
    send_to_closer: "Dossier transmis au closer",
    closing_followup: "Relance closing",
    deal_signed: "Accord / deal signé",
    critical_alert: "Alerte critique",
    sheet_misconfigured: "Fiche CEE à vérifier",
    no_team_member: "Équipe incomplète sur une fiche",
    vt_created: "Visite technique créée",
    vt_updated: "Visite technique mise à jour",
  };

  const severity: NotificationSeverity =
    eventType === "critical_alert" || eventType === "sheet_misconfigured" || eventType === "no_team_member"
      ? "critical"
      : eventType === "docs_missing" || eventType === "closing_followup"
        ? "warning"
        : "info";

  const lines: string[] = [
    `Entreprise : ${company}`,
    payload.actionRequired?.trim() ? `Action : ${sanitizeSlackVisibleText(payload.actionRequired)}` : "",
  ].filter(Boolean);

  if (payload.detailLines?.length) {
    for (const line of payload.detailLines) {
      const t = sanitizeSlackVisibleText(line);
      if (t) lines.push(t);
    }
  }

  return {
    title: titleByEvent[eventType],
    lines,
    severity,
    actionUrl: payload.erpUrl?.trim() || undefined,
    actionLabel: payload.actionLabel?.trim() || "Ouvrir dans l’ERP",
  };
}

/**
 * Déduit un type d’événement routable à partir d’une alerte cockpit (automation Slack).
 */
export function mapCockpitAlertToAutomationEventType(alert: CockpitAlert): SlackAutomationEventType {
  if (alert.severity === "critical") {
    return "critical_alert";
  }
  if (alert.category === "configuration") {
    return "sheet_misconfigured";
  }
  if (alert.category === "staffing") {
    return "no_team_member";
  }
  if (alert.category === "documentation" || alert.category === "quality") {
    return "docs_missing";
  }
  if (alert.relatedQueueKey === "docsPreparedStale") {
    return "docs_missing";
  }
  if (alert.relatedQueueKey === "oldAgreementSent" || alert.relatedQueueKey === "agreementsAwaitingSign") {
    return "closing_followup";
  }
  if (alert.category === "followup") {
    return "closing_followup";
  }
  if (alert.category === "conversion" || alert.category === "funnel") {
    return "deal_signed";
  }
  return "lead_contacted";
}
