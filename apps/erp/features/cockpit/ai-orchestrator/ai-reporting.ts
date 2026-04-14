import { insertAutomationLogSupabase } from "@/features/automation/services/automation-log-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSlackEnv } from "@/features/notifications/infra/slack-env";
import { sendWebhookMessage } from "@/features/notifications/infra/slack-webhook-client";

import { getAiOrchestrationNotifyUserIds } from "./orchestrator-env";
import type { BusinessStateAnalysis } from "./types";
import type { ExecuteAiActionsResult } from "./ai-execution-engine";

const HOUR_MS = 3_600_000;

async function hasHourlyReportRecently(): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const { data, error } = await admin
    .from("automation_logs")
    .select("id")
    .eq("automation_type", "ai_orchestrator_report")
    .gte("created_at", since)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

function buildSummaryText(
  exec: ExecuteAiActionsResult,
  state: BusinessStateAnalysis,
  automationOk: boolean,
): { text: string; critical: boolean } {
  const lines: string[] = [];
  lines.push("*IA cockpit — activité automatique (orchestrateur)*");
  lines.push(
    `Exécutions : ${exec.executed} OK · ${exec.failed} échec(s) · ${exec.skipped} ignorée(s) (doublon / limite / règle).`,
  );
  const critical =
    !automationOk ||
    (state.leadsCreatedToday === 0 && new Date().getHours() >= 10 && new Date().getHours() <= 19) ||
    state.overdueCallbacksCount >= 8;

  if (critical) {
    lines.push("");
    lines.push("*Points d’attention* :");
    if (!automationOk) lines.push("· Tick automation / alertes : problème signalé sur le dernier cron.");
    if (state.leadsCreatedToday === 0) lines.push("· Aucun lead créé aujourd’hui (fenêtre métier).");
    if (state.overdueCallbacksCount >= 8) lines.push(`· Volume élevé de rappels en retard (~${state.overdueCallbacksCount}).`);
  } else {
    lines.push("");
    lines.push("Aucun signal critique supplémentaire sur les indicateurs synthétiques.");
  }

  return { text: lines.join("\n"), critical };
}

/**
 * Résumé direction : max 1 / heure — Slack (webhook direction / alerts) + notifications in-app.
 */
export async function generateReport(
  exec: ExecuteAiActionsResult,
  state: BusinessStateAnalysis,
  automationOk: boolean,
): Promise<void> {
  if (await hasHourlyReportRecently()) return;

  const { text, critical } = buildSummaryText(exec, state, automationOk);
  const admin = createAdminClient();
  const env = getSlackEnv();
  const url = env.webhooks.direction ?? env.webhooks.alerts ?? env.webhooks.default;
  if (env.enabled && url) {
    await sendWebhookMessage(url, { text });
  }

  const targets = getAiOrchestrationNotifyUserIds();
  const now = new Date().toISOString();
  for (const userId of targets) {
    await admin.from("app_notifications").insert({
      user_id: userId,
      type: "cockpit_ai_orchestrator",
      title: critical ? "Synthèse IA cockpit — attention" : "Synthèse IA cockpit",
      body: text.replace(/\*/g, "").slice(0, 4000),
      severity: critical ? "warning" : "info",
      entity_type: "ai_orchestrator",
      entity_id: null,
      action_url: "/cockpit",
      is_read: false,
      is_dismissed: false,
      metadata_json: { source: "ai_orchestrator_report" },
      delivered_at: now,
      dedupe_key: `ai_orch_report_hour:${userId}:${now.slice(0, 13)}`,
    });
  }

  await insertAutomationLogSupabase(admin, {
    automationType: "ai_orchestrator_report",
    status: "success",
    resultJson: {
      executed: exec.executed,
      failed: exec.failed,
      skipped: exec.skipped,
      critical,
    },
    dedupeKey: `ai_orchestrator_report:${new Date().toISOString().slice(0, 13)}`,
  });
}
