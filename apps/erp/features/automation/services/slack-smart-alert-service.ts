import type { SupabaseClient } from "@supabase/supabase-js";

import { absoluteAutomationUrl, getAutomationConfig } from "@/features/automation/domain/config";
import type { SlackSmartAlertBuildInput } from "@/features/automation/domain/types";
import { evaluateAutomationRuleForSlack, shouldSendSlackSmartAlert } from "@/features/automation/rules/automation-rule-engine";
import {
  insertAutomationLog,
  insertAutomationLogSupabase,
  type AutomationLogInsert,
} from "@/features/automation/services/automation-log-service";
import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import {
  buildSlackMessageFromEvent,
  mapCockpitAlertToAutomationEventType,
  resolveSlackWebhookForEvent,
  sanitizeSlackVisibleText,
} from "@/features/notifications/domain/slack-automation-routing";
import { SlackEventType } from "@/features/notifications/domain/slack-events";
import { renderSlackText } from "@/features/notifications/domain/render-slack";
import type { NotificationChannelKey, SlackNotificationPayload } from "@/features/notifications/domain/types";
import { sendWebhookMessage } from "@/features/notifications/infra/slack-webhook-client";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

function classifySlackKind(
  alert: CockpitAlert,
  decision: ReturnType<typeof evaluateAutomationRuleForSlack>,
): SlackSmartAlertBuildInput["kind"] {
  if (decision.immediateCashSignal) return "cockpit_cash_signal";
  if (alert.category === "staffing") return "cockpit_staffing";
  if (alert.category === "configuration") return "cockpit_configuration";
  if (alert.category === "followup" || alert.relatedQueueKey === "oldAgreementSent") {
    return "cockpit_followup_backlog";
  }
  if (alert.severity === "critical") return "cockpit_critical";
  return "cockpit_urgent_high_impact";
}

export function buildSlackSmartAlertPayload(alert: CockpitAlert): SlackNotificationPayload {
  const decision = evaluateAutomationRuleForSlack(alert);
  const kind = classifySlackKind(alert, decision);
  const eventType = mapCockpitAlertToAutomationEventType(alert);
  const companyName =
    alert.topWorkflows[0]?.companyName?.trim() || alert.targetLabel?.trim() || null;

  const href = absoluteAutomationUrl(alert.cta?.href || alert.href || "/");
  const msgParts = buildSlackMessageFromEvent(eventType, {
    companyName,
    actionRequired: alert.suggestedAction,
    erpUrl: href,
    actionLabel: alert.cta?.label || "Ouvrir dans l’ERP",
    detailLines: [sanitizeSlackVisibleText(alert.message.replace(/\s+/g, " ").trim())].filter(Boolean),
  });

  const routing = resolveSlackWebhookForEvent(eventType, { cockpitAlertId: alert.id });
  const primaryChannel: NotificationChannelKey =
    routing.ok && routing.targets.length > 0 ? routing.targets[0].channelKey : "alerts";

  return {
    title: `[Cockpit] ${msgParts.title}`,
    lines: msgParts.lines,
    severity: msgParts.severity,
    channelKey: primaryChannel,
    actionUrl: msgParts.actionUrl,
    actionLabel: msgParts.actionLabel,
    metadata: {
      automation: "slack_smart",
      kind,
      cockpitAlertId: alert.id,
      ruleId: decision.ruleId,
      priorityLevel: alert.priorityLevel,
      estimatedImpactEuro: alert.estimatedImpactEuro,
      slackAutomationEventType: eventType,
    },
  };
}

export function buildSlackSmartAlertDedupeKey(alert: CockpitAlert): string {
  const day = new Date().toISOString().slice(0, 10);
  return `slack-smart:${alert.id}:${day}`;
}

/**
 * Vérifie si une alerte identique a déjà été notifiée récemment (anti-spam).
 * @returns true si doublon (ne pas renvoyer).
 */
export async function dedupeSlackSmartAlert(
  supabase: Supabase,
  dedupeKey: string,
  windowMs?: number,
): Promise<boolean> {
  const cfg = getAutomationConfig();
  const w = windowMs ?? cfg.slackDedupeWindowMs;
  const since = new Date(Date.now() - w).toISOString();
  const { data, error } = await supabase
    .from("automation_logs")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .eq("automation_type", "slack_smart_alert")
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[automation] dedupeSlackSmartAlert query failed:", error.message);
    return false;
  }
  return Boolean(data?.id);
}

export async function sendSlackSmartAlert(
  alert: CockpitAlert,
  options?: { supabase?: Supabase },
): Promise<{ status: "sent" | "skipped" | "failed"; detail: string }> {
  const cfg = getAutomationConfig();
  const supabase = options?.supabase;
  const dedupeKey = buildSlackSmartAlertDedupeKey(alert);

  async function persist(row: AutomationLogInsert) {
    if (supabase) await insertAutomationLogSupabase(supabase, row);
    else await insertAutomationLog(row);
  }

  if (!cfg.slackSmartEnabled) {
    await persist({
      automationType: "slack_smart_alert",
      ruleId: "disabled",
      status: "skipped",
      dedupeKey,
      resultJson: { reason: "AUTOMATION_SLACK_SMART_ENABLED=false" },
    });
    return { status: "skipped", detail: "Slack smart désactivé." };
  }

  if (!shouldSendSlackSmartAlert(alert)) {
    await persist({
      automationType: "slack_smart_alert",
      ruleId: "rule_skip",
      status: "skipped",
      dedupeKey,
      resultJson: { alertId: alert.id },
    });
    return { status: "skipped", detail: "Règles : pas d’envoi." };
  }

  if (supabase) {
    const dup = await dedupeSlackSmartAlert(supabase, dedupeKey);
    if (dup) {
      await insertAutomationLogSupabase(supabase, {
        automationType: "slack_smart_alert",
        ruleId: "dedupe",
        status: "skipped",
        dedupeKey,
        resultJson: { alertId: alert.id, reason: "dedupe_window" },
      });
      return { status: "skipped", detail: "Doublon récent." };
    }
  }

  const payload = buildSlackSmartAlertPayload(alert);
  const decision = evaluateAutomationRuleForSlack(alert);
  const eventType = mapCockpitAlertToAutomationEventType(alert);
  console.log("SLACK EVENT TYPE:", eventType);
  const routing = resolveSlackWebhookForEvent(eventType, { cockpitAlertId: alert.id });

  if (!routing.ok) {
    console.warn("[automation][slack-smart] routing failed:", routing.reason, { eventType });
    await persist({
      automationType: "slack_smart_alert",
      ruleId: decision.ruleId,
      status: "failed",
      dedupeKey,
      errorMessage: routing.reason,
      resultJson: { alertId: alert.id, eventType },
    });
    return { status: "failed", detail: routing.reason };
  }

  const text = renderSlackText(payload);
  const targets = routing.targets;

  const sendResults = await Promise.all(
    targets.map(async (t) => {
      const result = await sendWebhookMessage(t.url, { text });
      const success = result.ok;
      console.log(
        `[automation][slack-smart] eventType=${eventType} channel=${t.channelKey} webhookFallback=${t.usedFallback} success=${success}`,
      );
      return {
        channelKey: t.channelKey,
        usedFallback: t.usedFallback,
        success,
        error: success ? undefined : "error" in result ? result.error : "Erreur webhook",
      };
    }),
  );

  const anySuccess = sendResults.some((r) => r.success);
  const firstError = sendResults.find((r) => !r.success)?.error;

  if (anySuccess) {
    await persist({
      automationType: "slack_smart_alert",
      ruleId: decision.ruleId,
      status: "success",
      dedupeKey,
      slackChannel: targets.map((t) => t.channelKey).join(","),
      slackEventType: SlackEventType.AUTOMATION_SMART_ALERT,
      resultJson: {
        alertId: alert.id,
        title: payload.title,
        eventType,
        webhookTargets: sendResults,
        partialFailure: sendResults.some((r) => !r.success),
      },
    });
    return {
      status: "sent",
      detail: sendResults.some((r) => !r.success)
        ? `OK (au moins un canal ; erreurs : ${firstError ?? "—"})`
        : "OK",
    };
  }

  console.warn("[automation][slack-smart] all webhooks failed:", firstError, { eventType, targets: targets.length });

  await persist({
    automationType: "slack_smart_alert",
    ruleId: decision.ruleId,
    status: "failed",
    dedupeKey,
    errorMessage: firstError ?? "Tous les webhooks ont échoué.",
    resultJson: { alertId: alert.id, eventType, sendResults },
  });

  return { status: "failed", detail: firstError ?? "Tous les webhooks ont échoué." };
}
