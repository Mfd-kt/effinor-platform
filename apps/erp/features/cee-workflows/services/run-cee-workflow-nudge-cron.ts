import type { SupabaseClient } from "@supabase/supabase-js";

import type { AutomationType } from "@/features/automation/domain/types";
import { resolveAutomationPublicAppBaseUrl } from "@/features/automation/domain/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { firstInstantOfParisYmd, ymdParis } from "@/lib/datetime/paris-day";
import { SlackEventType } from "@/features/notifications/domain/slack-events";
import type { NotificationChannelKey, SlackNotificationPayload } from "@/features/notifications/domain/types";
import { sendSlackNotification } from "@/features/notifications/services/slack-notification-service";
import type { Database, Json } from "@/types/database.types";

export type CeeWorkflowNudgeResult = {
  executedAt: string;
  durationMs: number;
  dryRun: boolean;
  /** Workflows éligibles (statut + stagnation + non archivé). */
  eligible: number;
  notified: number;
  skippedDedupe: number;
  skippedDryRun: number;
  tasksCreated: number;
  slackSent: number;
  slackSkipped: number;
  staleDays: number;
  statuses: string[];
  /** Lundi (YYYY-MM-DD, Europe/Paris) servant à la clé de dédup hebdomadaire. */
  weekKeyParis: string;
  errors: { workflowId: string; message: string }[];
};

const DEDUPE_IN_CHUNK = 120;
const NUDGE_AUTOMATION_TYPE: AutomationType = "cee_workflow_nudge";

const CLOSER_PHASE = new Set([
  "docs_prepared",
  "to_close",
  "agreement_sent",
  "agreement_signed",
  "quote_pending",
  "quote_sent",
  "quote_signed",
]);

const CONFIRM_PHASE = new Set(["to_confirm", "simulation_done", "qualified"]);

type WorkflowNudgeRow = {
  id: string;
  lead_id: string;
  cee_sheet_id: string;
  workflow_status: string;
  updated_at: string;
  assigned_agent_user_id: string | null;
  assigned_confirmateur_user_id: string | null;
  assigned_closer_user_id: string | null;
  lead: { company_name: string; deleted_at: string | null } | null;
  cee_sheet: { label: string; code: string } | null;
};

type NudgeCandidate = {
  workflowId: string;
  dedupeKey: string;
  workflowStatus: string;
  leadId: string;
  updatedAtIso: string;
  assigneeId: string | null;
  companyName: string | null;
  sheetLabel: string | null;
  sheetCode: string | null;
};

function emptySideEffectCounts(): Pick<
  CeeWorkflowNudgeResult,
  "tasksCreated" | "slackSent" | "slackSkipped"
> {
  return { tasksCreated: 0, slackSent: 0, slackSkipped: 0 };
}

function parseNudgeStatuses(): string[] {
  const raw = process.env.CEE_NUDGE_STATUSES?.trim();
  if (!raw) {
    return ["to_confirm", "to_close", "docs_prepared"];
  }
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : ["to_confirm", "to_close", "docs_prepared"];
}

function parseStaleDays(): number {
  const raw = process.env.CEE_NUDGE_STALE_DAYS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 3;
  if (!Number.isFinite(n) || n < 1) {
    return 3;
  }
  return Math.min(n, 365);
}

function parseMaxRows(): number {
  const raw = process.env.CEE_NUDGE_MAX_ROWS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 500;
  if (!Number.isFinite(n) || n < 1) {
    return 500;
  }
  return Math.min(n, 2000);
}

/**
 * Lundi du calendrier courant à Paris (YYYY-MM-DD) — ancrage dédup « une fois par semaine ».
 */
function parisMondayYmdOfWeek(now: Date): string {
  const ymd = ymdParis(now.getTime());
  let ms = firstInstantOfParisYmd(ymd);
  for (let guard = 0; guard < 8; guard++) {
    const weekday = new Date(ms + 9 * 3600 * 1000).toLocaleDateString("en-US", {
      timeZone: "Europe/Paris",
      weekday: "short",
    });
    if (weekday === "Mon") {
      return ymdParis(ms);
    }
    ms -= 24 * 3600 * 1000;
  }
  return ymd;
}

function buildDedupeKey(workflowId: string, weekMondayParisYmd: string): string {
  return `cee_nudge:${workflowId}:${weekMondayParisYmd}`;
}

function resolveAssignee(workflowStatus: string, w: WorkflowNudgeRow): string | null {
  const s = workflowStatus.trim();
  if (CLOSER_PHASE.has(s)) {
    return w.assigned_closer_user_id ?? w.assigned_confirmateur_user_id ?? w.assigned_agent_user_id ?? null;
  }
  if (CONFIRM_PHASE.has(s)) {
    return w.assigned_confirmateur_user_id ?? w.assigned_closer_user_id ?? w.assigned_agent_user_id ?? null;
  }
  return w.assigned_agent_user_id ?? w.assigned_confirmateur_user_id ?? w.assigned_closer_user_id ?? null;
}

function slackChannelForStatus(workflowStatus: string): NotificationChannelKey {
  const s = workflowStatus.trim();
  if (CLOSER_PHASE.has(s)) {
    return "closer";
  }
  if (CONFIRM_PHASE.has(s)) {
    return "confirmateur";
  }
  return "commercial";
}

function workflowActionUrl(base: string, workflowStatus: string, workflowId: string, leadId: string): string {
  const s = workflowStatus.trim();
  if (CONFIRM_PHASE.has(s)) {
    return `${base}/confirmateur/${workflowId}`;
  }
  return `${base}/leads/${leadId}`;
}

function formatUpdatedParis(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function loadExistingDedupeKeys(
  supabase: SupabaseClient<Database>,
  keys: string[],
): Promise<{ existing: Set<string>; queryError: string | null }> {
  const existing = new Set<string>();
  if (keys.length === 0) {
    return { existing, queryError: null };
  }

  for (let i = 0; i < keys.length; i += DEDUPE_IN_CHUNK) {
    const chunk = keys.slice(i, i + DEDUPE_IN_CHUNK);
    const { data, error } = await supabase
      .from("automation_logs")
      .select("dedupe_key")
      .eq("automation_type", NUDGE_AUTOMATION_TYPE)
      .in("dedupe_key", chunk);

    if (error) {
      return { existing: new Set(), queryError: error.message };
    }
    for (const row of data ?? []) {
      if (row.dedupe_key) {
        existing.add(row.dedupe_key);
      }
    }
  }

  return { existing, queryError: null };
}

async function deliverCeeWorkflowNudge(
  supabase: SupabaseClient<Database>,
  c: NudgeCandidate,
  now: Date,
): Promise<{
  taskCreated: boolean;
  taskError: string | null;
  slack: Awaited<ReturnType<typeof sendSlackNotification>>;
}> {
  const base = resolveAutomationPublicAppBaseUrl().replace(/\/$/, "");
  const company = c.companyName?.trim() || "Société non renseignée";
  const sheet = [c.sheetLabel?.trim(), c.sheetCode?.trim()].filter(Boolean).join(" — ") || "Fiche CEE";
  const updated = formatUpdatedParis(c.updatedAtIso);
  const title = `Dossier CEE stagnant — ${company}`;
  const description = [
    `Statut workflow : ${c.workflowStatus}`,
    `Fiche : ${sheet}`,
    `Dernière activité (màj fiche) : ${updated} (Europe/Paris)`,
    workflowActionUrl(base, c.workflowStatus, c.workflowId, c.leadId),
  ].join("\n");

  const { error: taskInsErr } = await supabase.from("tasks").insert({
    title,
    description,
    task_type: "cee_workflow_nudge",
    priority: "normal",
    status: "open",
    due_date: now.toISOString(),
    assigned_user_id: c.assigneeId,
    created_by_user_id: null,
    related_entity_type: "lead_sheet_workflow",
    related_entity_id: c.workflowId,
  });

  const taskError = taskInsErr ? taskInsErr.message : null;
  const taskCreated = !taskInsErr;

  const channelKey = slackChannelForStatus(c.workflowStatus);
  const actionUrl = workflowActionUrl(base, c.workflowStatus, c.workflowId, c.leadId);

  const slackPayload: SlackNotificationPayload = {
    title: `Dossier CEE stagnant — ${company}`,
    lines: [
      `Statut : ${c.workflowStatus}`,
      `Fiche CEE : ${sheet}`,
      `Dernière activité : ${updated} (Europe/Paris)`,
      "Action interne : faire avancer le dossier (aucun contact client automatisé).",
    ],
    severity: "warning",
    channelKey,
    actionUrl,
    actionLabel: "Ouvrir dans l’ERP",
  };

  const slack = await sendSlackNotification(slackPayload, {
    eventType: SlackEventType.CEE_WORKFLOW_NUDGE_CRON,
    entityType: "lead_sheet_workflow",
    entityId: c.workflowId,
  });

  return { taskCreated, taskError, slack };
}

/**
 * Détecte les workflows CEE stagnants (statuts configurables, `updated_at` ancien),
 * puis tâche interne + Slack (canal selon phase) — pas de contact client.
 * Dédup hebdomadaire : `automation_logs` + `cee_nudge:<workflow_id>:<lundi Paris YYYY-MM-DD>`.
 */
export async function runCeeWorkflowNudgeCron(options: {
  dryRun: boolean;
  now?: Date;
}): Promise<CeeWorkflowNudgeResult> {
  const executedAt = new Date().toISOString();
  const started = Date.now();
  const now = options.now ?? new Date();
  const dryRun = options.dryRun;
  const statuses = parseNudgeStatuses();
  const staleDays = parseStaleDays();
  const maxRows = parseMaxRows();
  const weekKeyParis = parisMondayYmdOfWeek(now);
  const zeros = emptySideEffectCounts();

  const staleBeforeMs = now.getTime() - staleDays * 86400000;
  const staleBeforeIso = new Date(staleBeforeMs).toISOString();

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("lead_sheet_workflows")
    .select(
      `
      id,
      lead_id,
      cee_sheet_id,
      workflow_status,
      updated_at,
      assigned_agent_user_id,
      assigned_confirmateur_user_id,
      assigned_closer_user_id,
      lead:leads!lead_id ( company_name, deleted_at ),
      cee_sheet:cee_sheets!cee_sheet_id ( label, code )
    `,
    )
    .eq("is_archived", false)
    .in("workflow_status", statuses)
    .lte("updated_at", staleBeforeIso)
    .order("updated_at", { ascending: true })
    .limit(maxRows);

  const errors: { workflowId: string; message: string }[] = [];

  if (error) {
    errors.push({ workflowId: "_query", message: error.message });
    return {
      executedAt,
      durationMs: Date.now() - started,
      dryRun,
      eligible: 0,
      notified: 0,
      skippedDedupe: 0,
      skippedDryRun: 0,
      ...zeros,
      staleDays,
      statuses,
      weekKeyParis,
      errors,
    };
  }

  const candidates: NudgeCandidate[] = [];

  for (const raw of rows ?? []) {
    const row = raw as unknown as WorkflowNudgeRow;
    if (!row.lead || row.lead.deleted_at != null) {
      continue;
    }
    const companyName = row.lead?.company_name?.trim() || null;
    const sheet = row.cee_sheet;
    candidates.push({
      workflowId: row.id,
      dedupeKey: buildDedupeKey(row.id, weekKeyParis),
      workflowStatus: row.workflow_status,
      leadId: row.lead_id,
      updatedAtIso: row.updated_at,
      assigneeId: resolveAssignee(row.workflow_status, row),
      companyName,
      sheetLabel: sheet?.label?.trim() ?? null,
      sheetCode: sheet?.code?.trim() ?? null,
    });
  }

  const eligible = candidates.length;
  const uniqueKeys = [...new Set(candidates.map((c) => c.dedupeKey))];
  const { existing: existingKeys, queryError } = await loadExistingDedupeKeys(supabase, uniqueKeys);

  if (queryError) {
    errors.push({ workflowId: "_dedupe_query", message: queryError });
    return {
      executedAt,
      durationMs: Date.now() - started,
      dryRun,
      eligible,
      notified: 0,
      skippedDedupe: 0,
      skippedDryRun: 0,
      ...zeros,
      staleDays,
      statuses,
      weekKeyParis,
      errors,
    };
  }

  let skippedDedupe = 0;
  let skippedDryRun = 0;
  let notified = 0;
  let tasksCreated = 0;
  let slackSent = 0;
  let slackSkipped = 0;

  for (const c of candidates) {
    if (existingKeys.has(c.dedupeKey)) {
      skippedDedupe += 1;
      continue;
    }

    if (dryRun) {
      skippedDryRun += 1;
      continue;
    }

    const { taskCreated, taskError, slack } = await deliverCeeWorkflowNudge(supabase, c, now);

    if (taskCreated) {
      tasksCreated += 1;
    }
    if (slack.status === "sent") {
      slackSent += 1;
    } else if (slack.status === "skipped") {
      slackSkipped += 1;
    }

    const delivered = taskCreated || slack.status === "sent";
    if (!delivered) {
      const msg = [
        taskError ? `Tâche : ${taskError}` : null,
        slack.status === "skipped" ? `Slack : ${slack.reason}` : null,
        slack.status === "failed" ? `Slack : ${slack.error}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      errors.push({ workflowId: c.workflowId, message: msg || "Aucune action réalisée." });
      continue;
    }

    const resultJson: Record<string, unknown> = {
      workflowId: c.workflowId,
      workflowStatus: c.workflowStatus,
      leadId: c.leadId,
      weekKeyParis,
      staleDays,
      taskCreated,
      taskError,
      slackStatus: slack.status,
    };
    if (slack.status === "skipped") {
      resultJson.slackSkipReason = slack.reason;
    }
    if (slack.status === "failed") {
      resultJson.slackError = slack.error;
    }

    const { error: insertError } = await supabase.from("automation_logs").insert({
      automation_type: NUDGE_AUTOMATION_TYPE,
      dedupe_key: c.dedupeKey,
      workflow_id: c.workflowId,
      lead_id: c.leadId,
      status: "success",
      result_json: resultJson as Json,
    });

    if (insertError) {
      errors.push({ workflowId: c.workflowId, message: insertError.message });
      continue;
    }

    notified += 1;
    existingKeys.add(c.dedupeKey);
  }

  return {
    executedAt,
    durationMs: Date.now() - started,
    dryRun,
    eligible,
    notified,
    skippedDedupe,
    skippedDryRun,
    tasksCreated,
    slackSent,
    slackSkipped,
    staleDays,
    statuses,
    weekKeyParis,
    errors,
  };
}
