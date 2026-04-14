import { NextResponse } from "next/server";

import { runAutomationTick } from "@/features/automation/actions/run-automation-tick";
import { getCronAutomationSecret } from "@/features/automation/domain/cron-auth";
import { runCallbackAutoFollowupTick } from "@/features/commercial-callbacks/services/callback-auto-followup-service";
import { runCallbackAutomationTick } from "@/features/commercial-callbacks/services/run-callback-automation-tick";
import { runAiOrchestrator } from "@/features/cockpit/ai-orchestrator";
import { runAiOpsAgent } from "@/features/ai-ops-agent";
import { runInternalSlaEngine } from "@/features/internal-sla";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type CronErrorBody = {
  success: false;
  executedAt: string;
  error: { code: string; message: string };
};

type CronOkBody = {
  /** `false` si échec chargement alertes (`loadError` non nul). */
  success: boolean;
  executedAt: string;
  summary: string;
  durationMs: number;
  callbackAutomation?: {
    success: boolean;
    summary: string;
    durationMs: number;
    rowsUpdated: number;
    notificationsEnqueued: number;
  };
  callbackAutoFollowup?: {
    success: boolean;
    summary: string;
    durationMs: number;
    checked: number;
    eligible: number;
    sent: number;
    skipped: number;
    failed: number;
  };
  slack: {
    alertsLoaded: number;
    eligible: number;
    sent: number;
    skipped: number;
    failed: number;
  };
  errorsCount: number;
  loadError: string | null;
  assignmentsPerformed: number;
  aiDraftsGenerated: number;
  configSnapshot: Record<string, boolean>;
  aiOrchestrator?: {
    skipped: boolean;
    skipReason?: string;
    decisionsCount: number;
    executed: number;
    failed: number;
    keptAsRecommendation: number;
    durationMs: number;
  };
  aiOpsAgent?: {
    skipped: boolean;
    skipReason?: string;
    issuesDetected: number;
    issuesAfterGrouping: number;
    conversationsOpened: number;
    conversationsTouched: number;
    messagesSent: number;
    dedupeSkipped: number;
    cooldownSkipped: number;
    autoResolved: number;
    autoClosed: number;
    unsnoozed: number;
    messagesSuppressed: number;
    openCapSkipped: number;
    dailyCapSkipped: number;
    durationMs: number;
  };
  internalSla?: {
    skipped: boolean;
    skipReason?: string;
    checked: number;
    created: number;
    warning: number;
    breached: number;
    critical: number;
    resolved: number;
    escalated: number;
    durationMs: number;
  };
};

function unauthorized(): NextResponse<CronErrorBody> {
  return NextResponse.json(
    {
      success: false,
      executedAt: new Date().toISOString(),
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing credentials.",
      },
    },
    { status: 401 },
  );
}

function notConfigured(): NextResponse<CronErrorBody> {
  return NextResponse.json(
    {
      success: false,
      executedAt: new Date().toISOString(),
      error: {
        code: "CRON_NOT_CONFIGURED",
        message: "Automation cron is not configured on this server.",
      },
    },
    { status: 503 },
  );
}

function serverError(): NextResponse<CronErrorBody> {
  return NextResponse.json(
    {
      success: false,
      executedAt: new Date().toISOString(),
      error: {
        code: "INTERNAL_ERROR",
        message: "Automation tick failed.",
      },
    },
    { status: 500 },
  );
}

async function runAutomationCronHandler(request: Request): Promise<NextResponse<CronOkBody | CronErrorBody>> {
  const configuredSecret = getCronAutomationSecret();
  if (!configuredSecret) {
    return notConfigured();
  }

  const auth = request.headers.get("authorization")?.trim();
  const expected = `Bearer ${configuredSecret}`;
  if (!auth || auth !== expected) {
    return unauthorized();
  }

  try {
    const result = await runAutomationTick();
    let callbackAutomation: CronOkBody["callbackAutomation"];
    try {
      const cb = await runCallbackAutomationTick();
      callbackAutomation = {
        success: cb.success,
        summary: cb.summary,
        durationMs: cb.durationMs,
        rowsUpdated: cb.rowsUpdated,
        notificationsEnqueued: cb.notificationsEnqueued,
      };
    } catch (e) {
      console.error("[cron/automation] runCallbackAutomationTick:", e);
      callbackAutomation = {
        success: false,
        summary: e instanceof Error ? e.message : "callback_tick_failed",
        durationMs: 0,
        rowsUpdated: 0,
        notificationsEnqueued: 0,
      };
    }

    let callbackAutoFollowup: CronOkBody["callbackAutoFollowup"];
    try {
      const af = await runCallbackAutoFollowupTick();
      callbackAutoFollowup = {
        success: af.success,
        summary: af.summary,
        durationMs: af.durationMs,
        checked: af.checked,
        eligible: af.eligible,
        sent: af.sent,
        skipped: af.skipped,
        failed: af.failed,
      };
    } catch (e) {
      console.error("[cron/automation] runCallbackAutoFollowupTick:", e);
      callbackAutoFollowup = {
        success: false,
        summary: e instanceof Error ? e.message : "callback_auto_followup_failed",
        durationMs: 0,
        checked: 0,
        eligible: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
      };
    }

    let aiOrchestrator: CronOkBody["aiOrchestrator"];
    try {
      const orch = await runAiOrchestrator({
        automationTickSuccess: result.success && !result.loadError,
        automationLoadError: result.loadError,
      });
      aiOrchestrator = {
        skipped: orch.skipped,
        skipReason: orch.skipReason,
        decisionsCount: orch.decisionsCount,
        executed: orch.executed,
        failed: orch.failed,
        keptAsRecommendation: orch.keptAsRecommendation,
        durationMs: orch.durationMs,
      };
    } catch (e) {
      console.error("[cron/automation] runAiOrchestrator:", e);
      aiOrchestrator = {
        skipped: true,
        skipReason: e instanceof Error ? e.message : "orchestrator_failed",
        decisionsCount: 0,
        executed: 0,
        failed: 0,
        keptAsRecommendation: 0,
        durationMs: 0,
      };
    }

    let internalSla: CronOkBody["internalSla"];
    try {
      const sla = await runInternalSlaEngine();
      internalSla = {
        skipped: sla.skipped,
        skipReason: sla.skipReason,
        checked: sla.checked,
        created: sla.created,
        warning: sla.warning,
        breached: sla.breached,
        critical: sla.critical,
        resolved: sla.resolved,
        escalated: sla.escalated,
        durationMs: sla.durationMs,
      };
    } catch (e) {
      console.error("[cron/automation] runInternalSlaEngine:", e);
      internalSla = {
        skipped: true,
        skipReason: e instanceof Error ? e.message : "internal_sla_failed",
        checked: 0,
        created: 0,
        warning: 0,
        breached: 0,
        critical: 0,
        resolved: 0,
        escalated: 0,
        durationMs: 0,
      };
    }

    let aiOpsAgent: CronOkBody["aiOpsAgent"];
    try {
      const ops = await runAiOpsAgent();
      aiOpsAgent = {
        skipped: ops.skipped,
        skipReason: ops.skipReason,
        issuesDetected: ops.issuesDetected,
        issuesAfterGrouping: ops.issuesAfterGrouping,
        conversationsOpened: ops.conversationsOpened,
        conversationsTouched: ops.conversationsTouched,
        messagesSent: ops.messagesSent,
        dedupeSkipped: ops.dedupeSkipped,
        cooldownSkipped: ops.cooldownSkipped,
        autoResolved: ops.autoResolved,
        autoClosed: ops.autoClosed,
        unsnoozed: ops.unsnoozed,
        messagesSuppressed: ops.messagesSuppressed,
        openCapSkipped: ops.openCapSkipped,
        dailyCapSkipped: ops.dailyCapSkipped,
        durationMs: ops.durationMs,
      };
    } catch (e) {
      console.error("[cron/automation] runAiOpsAgent:", e);
      aiOpsAgent = {
        skipped: true,
        skipReason: e instanceof Error ? e.message : "ai_ops_agent_failed",
        issuesDetected: 0,
        issuesAfterGrouping: 0,
        conversationsOpened: 0,
        conversationsTouched: 0,
        messagesSent: 0,
        dedupeSkipped: 0,
        cooldownSkipped: 0,
        autoResolved: 0,
        autoClosed: 0,
        unsnoozed: 0,
        messagesSuppressed: 0,
        openCapSkipped: 0,
        dailyCapSkipped: 0,
        durationMs: 0,
      };
    }

    const body: CronOkBody = {
      success: result.success,
      executedAt: result.executedAt,
      summary: result.summary,
      durationMs: result.durationMs,
      callbackAutomation,
      callbackAutoFollowup,
      slack: {
        alertsLoaded: result.alertsLoaded,
        eligible: result.alertsEligibleForSlack,
        sent: result.slackAlertsSent,
        skipped: result.slackAlertsSkipped,
        failed: result.slackAlertsFailed,
      },
      errorsCount: result.errorsCount,
      loadError: result.loadError,
      assignmentsPerformed: result.assignmentsPerformed,
      aiDraftsGenerated: result.aiDraftsGenerated,
      configSnapshot: {
        slackSmartEnabled: result.configSnapshot.slackSmartEnabled,
        autoAssignConfirmateur: result.configSnapshot.autoAssignConfirmateur,
        autoAssignCloser: result.configSnapshot.autoAssignCloser,
        aiFollowUpDraftOnly: result.configSnapshot.aiFollowUpDraftOnly,
        aiFollowUpAutoSend: result.configSnapshot.aiFollowUpAutoSend,
      },
      aiOrchestrator,
      internalSla,
      aiOpsAgent,
    };

    const status = result.loadError ? 500 : 200;
    return NextResponse.json(body, { status });
  } catch (e) {
    console.error("[cron/automation] runAutomationTick:", e);
    return serverError();
  }
}

/**
 * Cron HTTP (Dokploy, etc.) — même logique pour GET et POST.
 * Sécurité : `Authorization: Bearer <AUTOMATION_CRON_SECRET>` ou `CRON_SECRET` (fallback).
 */
export async function GET(request: Request) {
  return runAutomationCronHandler(request);
}

export async function POST(request: Request) {
  return runAutomationCronHandler(request);
}
