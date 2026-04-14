"use server";

import { createAdminClient } from "@/lib/supabase/admin";

import { getAutomationConfig } from "@/features/automation/domain/config";
import { loadGlobalCockpitAlertsForAutomation } from "@/features/automation/queries/load-global-cockpit-alerts-for-automation";
import { sendSlackSmartAlert } from "@/features/automation/services/slack-smart-alert-service";
import { shouldSendSlackSmartAlert } from "@/features/automation/rules/automation-rule-engine";
import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";

/**
 * Résultat d’un tick cron — observable (logs / JSON HTTP).
 * Les assignations auto et relances IA ne sont pas exécutées dans ce tick :
 * elles sont déclenchées à la volée sur les transitions workflow.
 */
export type AutomationTickResult = {
  success: boolean;
  executedAt: string;
  durationMs: number;
  /** Résumé une ligne pour logs / monitoring. */
  summary: string;
  alertsLoaded: number;
  /** Alertes éligibles aux règles Slack (shouldSendSlackSmartAlert). */
  alertsEligibleForSlack: number;
  slackAlertsSent: number;
  slackAlertsSkipped: number;
  slackAlertsFailed: number;
  /** Erreurs partielles pendant l’envoi (une alerte ne bloque pas les suivantes). */
  errorsCount: number;
  /** Si le chargement des alertes cockpit a échoué. */
  loadError: string | null;
  /** Toujours 0 dans ce tick — réservé extension future (job batch). */
  assignmentsPerformed: number;
  /** Toujours 0 dans ce tick — réservé extension future (relances IA batch). */
  aiDraftsGenerated: number;
  /** Flags effectifs au moment du tick (sans exposer de secrets). */
  configSnapshot: {
    slackSmartEnabled: boolean;
    autoAssignConfirmateur: boolean;
    autoAssignCloser: boolean;
    aiFollowUpDraftOnly: boolean;
    aiFollowUpAutoSend: boolean;
  };
};

/**
 * Traite les alertes cockpit (Slack intelligent, dédup via automation_logs).
 * Idempotent côté Slack : même alerte / même fenêtre → skipped.
 */
export async function runAutomationTick(): Promise<AutomationTickResult> {
  const t0 = Date.now();
  const executedAt = new Date().toISOString();
  const cfg = getAutomationConfig();

  const baseConfig = {
    slackSmartEnabled: cfg.slackSmartEnabled,
    autoAssignConfirmateur: cfg.autoAssignConfirmateur,
    autoAssignCloser: cfg.autoAssignCloser,
    aiFollowUpDraftOnly: cfg.aiFollowUpDraftOnly,
    aiFollowUpAutoSend: cfg.aiFollowUpAutoSend,
  };

  let alerts: CockpitAlert[] = [];
  let loadError: string | null = null;

  try {
    alerts = await loadGlobalCockpitAlertsForAutomation();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "load_failed";
    console.error("[automation] loadGlobalCockpitAlertsForAutomation:", e);
    loadError = "Impossible de charger les alertes cockpit.";
    const durationMs = Date.now() - t0;
    return {
      success: false,
      executedAt,
      durationMs,
      summary: "Échec chargement alertes cockpit.",
      alertsLoaded: 0,
      alertsEligibleForSlack: 0,
      slackAlertsSent: 0,
      slackAlertsSkipped: 0,
      slackAlertsFailed: 0,
      errorsCount: 1,
      loadError,
      assignmentsPerformed: 0,
      aiDraftsGenerated: 0,
      configSnapshot: baseConfig,
    };
  }

  const candidates = alerts.filter((a) => shouldSendSlackSmartAlert(a));
  const supabase = createAdminClient();

  let slackAlertsSent = 0;
  let slackAlertsSkipped = 0;
  let slackAlertsFailed = 0;
  let errorsCount = 0;

  for (const alert of candidates) {
    try {
      const { status } = await sendSlackSmartAlert(alert, { supabase });
      if (status === "sent") slackAlertsSent += 1;
      else if (status === "skipped") slackAlertsSkipped += 1;
      else slackAlertsFailed += 1;
    } catch (err) {
      errorsCount += 1;
      slackAlertsFailed += 1;
      console.error("[automation] sendSlackSmartAlert failed:", alert.id, err);
    }
  }

  const durationMs = Date.now() - t0;
  /** Tick terminé (chargement OK). Les échecs Slack partiels sont dans errorsCount / slackAlertsFailed. */
  const success = loadError === null;
  const summary = [
    `alerts=${alerts.length}`,
    `slack_eligible=${candidates.length}`,
    `sent=${slackAlertsSent}`,
    `skipped=${slackAlertsSkipped}`,
    `failed=${slackAlertsFailed}`,
    `${durationMs}ms`,
  ].join(" ");

  return {
    success,
    executedAt,
    durationMs,
    summary,
    alertsLoaded: alerts.length,
    alertsEligibleForSlack: candidates.length,
    slackAlertsSent,
    slackAlertsSkipped,
    slackAlertsFailed,
    errorsCount,
    loadError,
    assignmentsPerformed: 0,
    aiDraftsGenerated: 0,
    configSnapshot: baseConfig,
  };
}
