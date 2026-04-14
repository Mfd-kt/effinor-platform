import {
  calendarDateInParis,
  isCallbackOverdue,
  isTerminalCallbackStatus,
} from "@/features/commercial-callbacks/domain/callback-dates";
import { computeCommercialCallbackScore } from "@/features/commercial-callbacks/lib/callback-scoring";
import { enqueueCallbackAppNotification } from "@/features/commercial-callbacks/services/enqueue-callback-app-notification";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

type CommercialCallbackUpdate = Database["public"]["Tables"]["commercial_callbacks"]["Update"];

const NO_AUTO = new Set(["in_progress", "completed", "cancelled", "converted_to_lead", "lost"]);

function computeNextStatus(row: CommercialCallbackRow, now: Date): string | null {
  if (NO_AUTO.has(row.status)) return null;
  if (row.snoozed_until && new Date(row.snoozed_until) > now) return null;

  const today = calendarDateInParis(now);
  if (row.callback_date < today) return "overdue";
  if (row.callback_date > today) return "pending";
  if (isCallbackOverdue(row.status, row.callback_date, row.callback_time, now)) return "overdue";
  return "due_today";
}

/**
 * Tick cron : scores, statuts due_today/overdue, notifications in-app anti-doublon.
 */
export async function runCallbackAutomationTick(): Promise<{
  success: boolean;
  durationMs: number;
  summary: string;
  rowsUpdated: number;
  notificationsEnqueued: number;
  errors: string[];
}> {
  const t0 = Date.now();
  const errors: string[] = [];
  let rowsUpdated = 0;
  let notificationsEnqueued = 0;

  try {
    const admin = createAdminClient();
    const { data: rows, error: fetchErr } = await admin
      .from("commercial_callbacks")
      .select("*")
      .is("deleted_at", null);

    if (fetchErr || !rows) {
      return {
        success: false,
        durationMs: Date.now() - t0,
        summary: fetchErr?.message ?? "fetch_failed",
        rowsUpdated: 0,
        notificationsEnqueued: 0,
        errors: [fetchErr?.message ?? "fetch_failed"],
      };
    }

    const now = new Date();

    for (const raw of rows as CommercialCallbackRow[]) {
      if (isTerminalCallbackStatus(raw.status)) continue;

      const { businessScore, confidenceScore } = computeCommercialCallbackScore(raw, now);
      const nextStatus = computeNextStatus(raw, now);

      const patch: CommercialCallbackUpdate = {
        business_score: businessScore,
        confidence_score: confidenceScore,
        updated_at: now.toISOString(),
      };
      if (nextStatus && nextStatus !== raw.status) {
        patch.status = nextStatus;
      }

      const { error: updErr } = await admin.from("commercial_callbacks").update(patch).eq("id", raw.id);
      if (updErr) {
        errors.push(`${raw.id}: ${updErr.message}`);
        continue;
      }
      rowsUpdated += 1;

      const userId = raw.assigned_agent_user_id ?? raw.created_by_user_id;
      if (!userId) continue;

      const hourBucket = Math.floor(now.getTime() / 3_600_000);
      const overdue =
        nextStatus === "overdue" ||
        raw.status === "overdue" ||
        isCallbackOverdue(raw.status, raw.callback_date, raw.callback_time, now);

      if (overdue && businessScore >= 40) {
        const dedupeKey = `cb:${raw.id}:overdue:${hourBucket}`;
        const r = await enqueueCallbackAppNotification({
          userId,
          type: "callback_overdue",
          title: "Rappel en retard",
          body: `${raw.company_name} — ${raw.contact_name}`,
          severity: businessScore >= 75 ? "critical" : "high",
          entityId: raw.id,
          actionUrl: "/agent",
          dedupeKey,
          metadata: { callbackId: raw.id, businessScore },
        });
        if (r.ok) notificationsEnqueued += 1;
        else errors.push(`notif ${raw.id}: ${r.error}`);
      } else if ((nextStatus === "due_today" || raw.status === "due_today") && businessScore >= 55) {
        const dedupeKey = `cb:${raw.id}:due_today:${hourBucket}`;
        const r = await enqueueCallbackAppNotification({
          userId,
          type: "callback_due_today",
          title: "Rappel aujourd’hui",
          body: `${raw.company_name} — priorité ${businessScore}/100`,
          severity: "warning",
          entityId: raw.id,
          actionUrl: "/agent",
          dedupeKey,
          metadata: { callbackId: raw.id, businessScore },
        });
        if (r.ok) notificationsEnqueued += 1;
        else errors.push(`notif ${raw.id}: ${r.error}`);
      }
    }

    const durationMs = Date.now() - t0;
    return {
      success: errors.length === 0,
      durationMs,
      summary: `callbacks: ${rowsUpdated} maj, ${notificationsEnqueued} notif.`,
      rowsUpdated,
      notificationsEnqueued,
      errors,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return {
      success: false,
      durationMs: Date.now() - t0,
      summary: msg,
      rowsUpdated,
      notificationsEnqueued,
      errors: [...errors, msg],
    };
  }
}
