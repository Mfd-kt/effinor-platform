import type { SupabaseClient } from "@supabase/supabase-js";

import type { AutomationType } from "@/features/automation/domain/types";
import { resolveAutomationPublicAppBaseUrl } from "@/features/automation/domain/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextParisYmd, ymdParis } from "@/lib/datetime/paris-day";
import { SlackEventType } from "@/features/notifications/domain/slack-events";
import type { SlackNotificationPayload } from "@/features/notifications/domain/types";
import { sendSlackNotification } from "@/features/notifications/services/slack-notification-service";
import type { Database, Json } from "@/types/database.types";

export type TechnicalVisitRemindersResult = {
  executedAt: string;
  durationMs: number;
  dryRun: boolean;
  eligibleJ1: number;
  eligibleH2: number;
  /** Lignes `automation_logs` insérées (dédup appliquée). */
  notified: number;
  skippedDedupe: number;
  skippedDryRun: number;
  tasksCreated: number;
  slackSent: number;
  slackSkipped: number;
  errors: { technicalVisitId: string; message: string }[];
};

const MAX_ROWS = 2000;
const DEDUPE_IN_CHUNK = 120;

const VT_REMINDER_AUTOMATION_TYPE: AutomationType = "technical_visit_reminder";

const H2_MIN_MS = 105 * 60 * 1000;
const H2_MAX_MS = 135 * 60 * 1000;
const UPPER_HORIZON_MS = 50 * 3600 * 1000;

type ReminderSlot = "j1" | "h2";

type VtReminderRow = {
  id: string;
  scheduled_at: string | null;
  technician_id: string | null;
  lead_id: string;
  vt_reference: string;
  leads: { company_name: string } | null;
};

type ReminderCandidate = {
  technicalVisitId: string;
  slot: ReminderSlot;
  dedupeKey: string;
  scheduledAtIso: string;
  technicianId: string | null;
  leadId: string;
  vtReference: string;
  companyName: string | null;
};

function emptySideEffectCounts(): Pick<
  TechnicalVisitRemindersResult,
  "tasksCreated" | "slackSent" | "slackSkipped"
> {
  return { tasksCreated: 0, slackSent: 0, slackSkipped: 0 };
}

function isEligibleJ1Paris(scheduledAtIso: string, now: Date): boolean {
  const visitMs = new Date(scheduledAtIso).getTime();
  if (!Number.isFinite(visitMs) || visitMs <= now.getTime()) {
    return false;
  }
  const todayParis = ymdParis(now.getTime());
  const visitDayParis = ymdParis(visitMs);
  const tomorrowParis = nextParisYmd(todayParis);
  return visitDayParis === tomorrowParis;
}

function isEligibleH2Window(scheduledAtIso: string, now: Date): boolean {
  const visitMs = new Date(scheduledAtIso).getTime();
  if (!Number.isFinite(visitMs)) {
    return false;
  }
  const msUntil = visitMs - now.getTime();
  return msUntil >= H2_MIN_MS && msUntil <= H2_MAX_MS;
}

function buildDedupeKey(slot: ReminderSlot, technicalVisitId: string, parisYmd: string): string {
  return `vt_reminder:${slot}:${technicalVisitId}:${parisYmd}`;
}

function formatVtWhenParis(scheduledAtIso: string): string {
  return new Date(scheduledAtIso).toLocaleString("fr-FR", {
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
      .eq("automation_type", VT_REMINDER_AUTOMATION_TYPE)
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

async function deliverTechnicalVisitReminder(
  supabase: SupabaseClient<Database>,
  c: ReminderCandidate,
  now: Date,
): Promise<{
  taskCreated: boolean;
  taskError: string | null;
  slack: Awaited<ReturnType<typeof sendSlackNotification>>;
}> {
  const base = resolveAutomationPublicAppBaseUrl().replace(/\/$/, "");
  const whenParis = formatVtWhenParis(c.scheduledAtIso);
  const title =
    c.slot === "j1" ? `Rappel VT J-1 — ${c.vtReference}` : `Rappel VT (~2 h) — ${c.vtReference}`;
  const description = [
    `Visite prévue : ${whenParis} (Europe/Paris)`,
    c.companyName ? `Société : ${c.companyName}` : null,
    `Lead : ${c.leadId}`,
    `${base}/technical-visits/${c.technicalVisitId}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const { error: taskInsErr } = await supabase.from("tasks").insert({
    title,
    description,
    task_type: "vt_reminder",
    priority: c.slot === "h2" ? "high" : "normal",
    status: "open",
    due_date: now.toISOString(),
    assigned_user_id: c.technicianId,
    created_by_user_id: null,
    related_entity_type: "technical_visit",
    related_entity_id: c.technicalVisitId,
  });

  const taskError = taskInsErr ? taskInsErr.message : null;
  const taskCreated = !taskInsErr;

  const slackPayload: SlackNotificationPayload = {
    title: c.slot === "j1" ? `Rappel VT J-1 — ${c.vtReference}` : `Rappel VT H-2 — ${c.vtReference}`,
    lines: [
      c.companyName ? `Société : ${c.companyName}` : null,
      `Réf. VT : ${c.vtReference}`,
      `Créneau : ${whenParis} (Europe/Paris)`,
      c.slot === "j1" ? "Type : veille (J-1)." : "Type : ~2 h avant la visite.",
    ].filter((line): line is string => Boolean(line)),
    severity: c.slot === "h2" ? "warning" : "info",
    channelKey: "technique",
    actionUrl: `${base}/technical-visits/${c.technicalVisitId}`,
    actionLabel: "Ouvrir la visite technique",
  };

  const slack = await sendSlackNotification(slackPayload, {
    eventType: SlackEventType.VT_REMINDER_CRON,
    entityType: "technical_visit",
    entityId: c.technicalVisitId,
  });

  return { taskCreated, taskError, slack };
}

/**
 * Rappels VT internes (J-1 Paris, ~H-2) : tâche ERP + Slack canal **technique** si configuré.
 * Pas de contact client. Dédup via `automation_logs.dedupe_key`.
 */
export async function runTechnicalVisitRemindersCron(options: {
  dryRun: boolean;
  now?: Date;
}): Promise<TechnicalVisitRemindersResult> {
  const executedAt = new Date().toISOString();
  const started = Date.now();
  const now = options.now ?? new Date();
  const dryRun = options.dryRun;
  const parisYmd = ymdParis(now.getTime());
  const zeros = emptySideEffectCounts();

  const supabase = createAdminClient();
  const upperIso = new Date(now.getTime() + UPPER_HORIZON_MS).toISOString();

  const { data: rows, error } = await supabase
    .from("technical_visits")
    .select(
      `
      id,
      scheduled_at,
      technician_id,
      lead_id,
      vt_reference,
      leads ( company_name )
    `,
    )
    .eq("status", "scheduled")
    .is("deleted_at", null)
    .not("scheduled_at", "is", null)
    .gt("scheduled_at", now.toISOString())
    .lte("scheduled_at", upperIso)
    .limit(MAX_ROWS);

  const errors: { technicalVisitId: string; message: string }[] = [];

  if (error) {
    errors.push({ technicalVisitId: "_query", message: error.message });
    return {
      executedAt,
      durationMs: Date.now() - started,
      dryRun,
      eligibleJ1: 0,
      eligibleH2: 0,
      notified: 0,
      skippedDedupe: 0,
      skippedDryRun: 0,
      ...zeros,
      errors,
    };
  }

  const candidates: ReminderCandidate[] = [];

  for (const raw of rows ?? []) {
    const row = raw as unknown as VtReminderRow;
    if (!row.scheduled_at) {
      continue;
    }
    const companyName = row.leads?.company_name?.trim() || null;
    const baseMeta = {
      technicalVisitId: row.id,
      scheduledAtIso: row.scheduled_at,
      technicianId: row.technician_id,
      leadId: row.lead_id,
      vtReference: row.vt_reference,
      companyName,
    };
    if (isEligibleJ1Paris(row.scheduled_at, now)) {
      candidates.push({
        ...baseMeta,
        slot: "j1",
        dedupeKey: buildDedupeKey("j1", row.id, parisYmd),
      });
    }
    if (isEligibleH2Window(row.scheduled_at, now)) {
      candidates.push({
        ...baseMeta,
        slot: "h2",
        dedupeKey: buildDedupeKey("h2", row.id, parisYmd),
      });
    }
  }

  const eligibleJ1 = candidates.filter((c) => c.slot === "j1").length;
  const eligibleH2 = candidates.filter((c) => c.slot === "h2").length;

  const uniqueKeys = [...new Set(candidates.map((c) => c.dedupeKey))];
  const { existing: existingKeys, queryError } = await loadExistingDedupeKeys(supabase, uniqueKeys);

  if (queryError) {
    errors.push({ technicalVisitId: "_dedupe_query", message: queryError });
    return {
      executedAt,
      durationMs: Date.now() - started,
      dryRun,
      eligibleJ1,
      eligibleH2,
      notified: 0,
      skippedDedupe: 0,
      skippedDryRun: 0,
      ...zeros,
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

    const { taskCreated, taskError, slack } = await deliverTechnicalVisitReminder(supabase, c, now);

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
      errors.push({ technicalVisitId: c.technicalVisitId, message: msg || "Aucune action réalisée." });
      continue;
    }

    const resultJson: Record<string, unknown> = {
      slot: c.slot,
      technicalVisitId: c.technicalVisitId,
      parisYmd,
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
      automation_type: VT_REMINDER_AUTOMATION_TYPE,
      dedupe_key: c.dedupeKey,
      status: "success",
      result_json: resultJson as Json,
    });

    if (insertError) {
      errors.push({ technicalVisitId: c.technicalVisitId, message: insertError.message });
      continue;
    }

    notified += 1;
    existingKeys.add(c.dedupeKey);
  }

  return {
    executedAt,
    durationMs: Date.now() - started,
    dryRun,
    eligibleJ1,
    eligibleH2,
    notified,
    skippedDedupe,
    skippedDryRun,
    tasksCreated,
    slackSent,
    slackSkipped,
    errors,
  };
}
