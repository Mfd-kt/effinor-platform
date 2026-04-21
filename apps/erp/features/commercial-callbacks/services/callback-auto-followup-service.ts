import { generateCallbackAutoFollowupEmail } from "@/features/commercial-callbacks/ai/generate-callback-auto-followup-email";
import {
  autoFollowupDedupeDayBucket,
  buildAutoFollowupDedupeKey,
  computeNextCallbackAutoFollowupAt,
  getCallbackAutoFollowupSkipReason,
  getMaxAutoFollowups,
  getMinHoursBetweenSends,
  isCallbackEligibleForAutoFollowup,
  type CallbackAutoFollowupContext,
} from "@/features/commercial-callbacks/lib/callback-auto-followup-rules";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import { sendEmail } from "@/lib/email/email-orchestrator";
import { getFromAddress, getMailTransport } from "@/lib/email/gmail-transport";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

const AUTOMATION_TYPE = "callback_auto_followup";

function cronGloballyEnabled(): boolean {
  return process.env.COMMERCIAL_CALLBACK_AUTO_FOLLOWUP_ENABLED === "true";
}

function mailReady(): boolean {
  if (process.env.COMMERCIAL_CALLBACK_AUTO_FOLLOWUP_SKIP_SEND === "true") {
    return false;
  }
  try {
    getMailTransport();
    return true;
  } catch {
    return false;
  }
}

async function wasDedupeSentRecently(dedupeKey: string, hours = 40): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data, error } = await admin
    .from("automation_logs")
    .select("id")
    .eq("dedupe_key", dedupeKey)
    .eq("status", "success")
    .gte("created_at", since)
    .limit(1);
  if (error) return true;
  return (data?.length ?? 0) > 0;
}

async function insertLog(input: {
  callbackId: string;
  dedupeKey: string | null;
  status: "success" | "skipped" | "failed";
  resultJson: Record<string, unknown>;
  errorMessage?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("automation_logs").insert({
    automation_type: AUTOMATION_TYPE,
    callback_id: input.callbackId,
    dedupe_key: input.dedupeKey,
    status: input.status,
    result_json: input.resultJson as Json,
    error_message: input.errorMessage ?? null,
  });
  if (error) {
    console.error("[callback-auto-followup] automation_logs insert:", error.message);
  }
}

/**
 * Met à jour la date de prochaine éligibilité théorique (cooldown / plafond).
 */
export async function scheduleCallbackAutoFollowupIfNeeded(callbackId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("commercial_callbacks")
    .select("*")
    .eq("id", callbackId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !row) return;

  const ctx: CallbackAutoFollowupContext = { now: new Date() };
  const next = computeNextCallbackAutoFollowupAt(row as CommercialCallbackRow, ctx);
  await admin
    .from("commercial_callbacks")
    .update({
      auto_followup_next_eligible_at: next?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", callbackId);
}

/**
 * Tente un envoi auto pour un rappel (cron ou action manuelle).
 */
export async function sendCallbackAutoFollowup(
  callbackId: string,
  options?: { bypassGlobalCronSwitch?: boolean },
): Promise<
  | { ok: true; sent: true; messageId?: string | null }
  | { ok: true; sent: false; skipped: string }
  | { ok: false; error: string }
> {
  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from("commercial_callbacks")
    .select("*")
    .eq("id", callbackId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };
  }

  const r = row as CommercialCallbackRow;
  const now = new Date();
  const ctx: CallbackAutoFollowupContext = { now };

  if (!options?.bypassGlobalCronSwitch && !cronGloballyEnabled()) {
    await insertLog({
      callbackId,
      dedupeKey: null,
      status: "skipped",
      resultJson: { reason: "global_disabled" },
    });
    return { ok: true, sent: false, skipped: "global_disabled" };
  }

  if (!mailReady()) {
    await insertLog({
      callbackId,
      dedupeKey: null,
      status: "skipped",
      resultJson: { reason: "mail_not_configured" },
    });
    return { ok: true, sent: false, skipped: "mail_not_configured" };
  }

  const elig = isCallbackEligibleForAutoFollowup(r, ctx);
  if (!elig.eligible || !elig.suggestedType) {
    const reason = elig.reason ?? "not_eligible";
    await admin
      .from("commercial_callbacks")
      .update({
        auto_followup_status: `skipped:${reason}`,
        updated_at: now.toISOString(),
      })
      .eq("id", callbackId);
    await insertLog({
      callbackId,
      dedupeKey: null,
      status: "skipped",
      resultJson: { reason, suggestedType: elig.suggestedType },
    });
    await scheduleCallbackAutoFollowupIfNeeded(callbackId);
    return { ok: true, sent: false, skipped: reason };
  }

  const dayBucket = autoFollowupDedupeDayBucket(now);
  const dedupeKey = buildAutoFollowupDedupeKey(callbackId, elig.suggestedType, dayBucket);
  if (await wasDedupeSentRecently(dedupeKey)) {
    await insertLog({
      callbackId,
      dedupeKey,
      status: "skipped",
      resultJson: { reason: "dedupe_recent", suggestedType: elig.suggestedType },
    });
    await admin
      .from("commercial_callbacks")
      .update({
        auto_followup_status: "skipped:dedupe_recent",
        updated_at: now.toISOString(),
      })
      .eq("id", callbackId);
    return { ok: true, sent: false, skipped: "dedupe_recent" };
  }

  const to = r.email!.trim();
  let subject: string;
  let html: string;
  let textBody: string;
  try {
    const gen = await generateCallbackAutoFollowupEmail(r, elig.suggestedType);
    subject = gen.subject;
    html = gen.htmlBody;
    textBody = gen.textBody;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate_failed";
    await insertLog({
      callbackId,
      dedupeKey,
      status: "failed",
      resultJson: { suggestedType: elig.suggestedType },
      errorMessage: msg,
    });
    await admin
      .from("commercial_callbacks")
      .update({
        auto_followup_status: "failed:generation",
        updated_at: now.toISOString(),
      })
      .eq("id", callbackId);
    return { ok: false, error: msg };
  }

  try {
    let messageId: string | null = null;
    const send = await sendEmail({
      type: "CALLBACK_FOLLOWUP",
      recipient: to,
      metadata: {
        provider: "smtp",
        sourceModule: "commercial-callbacks/automation",
      },
      execute: async () => {
        const transport = getMailTransport();
        const sendResult = await transport.sendMail({
          from: getFromAddress(),
          to,
          subject,
          html,
          text: textBody,
        });
        messageId = sendResult.messageId ?? null;
        return { ok: true };
      },
    });
    if (!send.ok) {
      throw new Error(send.error);
    }
    const nextCount = (r.auto_followup_count ?? 0) + 1;
    const minH = getMinHoursBetweenSends(ctx);
    const nextEligible = new Date(now.getTime() + minH * 3_600_000);

    await admin
      .from("commercial_callbacks")
      .update({
        auto_followup_last_sent_at: now.toISOString(),
        auto_followup_count: nextCount,
        auto_followup_status: "sent",
        last_outbound_email_at: now.toISOString(),
        auto_followup_next_eligible_at: nextEligible.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", callbackId);

    await insertLog({
      callbackId,
      dedupeKey,
      status: "success",
      resultJson: {
        recipient: to,
        subject,
        suggestedType: elig.suggestedType,
        messageId,
        urgency: elig.urgency,
      },
    });

    return { ok: true, sent: true, messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send_failed";
    console.error("[sendCallbackAutoFollowup]", e);
    await insertLog({
      callbackId,
      dedupeKey,
      status: "failed",
      resultJson: { suggestedType: elig.suggestedType, recipient: to, subject },
      errorMessage: msg,
    });
    await admin
      .from("commercial_callbacks")
      .update({
        auto_followup_status: "failed:send",
        updated_at: now.toISOString(),
      })
      .eq("id", callbackId);
    return { ok: false, error: msg };
  }
}

export type CallbackAutoFollowupTickResult = {
  success: boolean;
  summary: string;
  durationMs: number;
  checked: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

/**
 * Passe sur les rappels ouverts : envoi prudent, un par un, journalisé.
 */
export async function runCallbackAutoFollowupTick(): Promise<CallbackAutoFollowupTickResult> {
  const t0 = Date.now();
  const errors: string[] = [];
  let checked = 0;
  let eligible = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  if (!cronGloballyEnabled()) {
    return {
      success: true,
      summary: "callback_auto_followup: désactivé (COMMERCIAL_CALLBACK_AUTO_FOLLOWUP_ENABLED≠true).",
      durationMs: Date.now() - t0,
      checked: 0,
      eligible: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };
  }

  try {
    const admin = createAdminClient();
    const { data: rows, error: fetchErr } = await admin
      .from("commercial_callbacks")
      .select("*")
      .is("deleted_at", null);

    if (fetchErr || !rows) {
      return {
        success: false,
        summary: fetchErr?.message ?? "fetch_failed",
        durationMs: Date.now() - t0,
        checked: 0,
        eligible: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
        errors: [fetchErr?.message ?? "fetch_failed"],
      };
    }

    const now = new Date();
    const ctx: CallbackAutoFollowupContext = { now };

    for (const raw of rows as CommercialCallbackRow[]) {
      checked += 1;
      await scheduleCallbackAutoFollowupIfNeeded(raw.id);

      const e = isCallbackEligibleForAutoFollowup(raw, ctx);
      if (!e.eligible) {
        continue;
      }
      eligible += 1;

      const res = await sendCallbackAutoFollowup(raw.id, { bypassGlobalCronSwitch: true });
      if (!res.ok) {
        failed += 1;
        errors.push(`${raw.id}: ${res.error}`);
        continue;
      }
      if (res.sent) {
        sent += 1;
      } else {
        skipped += 1;
      }
    }

    const durationMs = Date.now() - t0;
    return {
      success: errors.length === 0,
      summary: `auto_followup: ${checked} vus, ${eligible} éligibles, ${sent} envoyés, ${skipped} ignorés, ${failed} échecs.`,
      durationMs,
      checked,
      eligible,
      sent,
      skipped,
      failed,
      errors,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return {
      success: false,
      summary: msg,
      durationMs: Date.now() - t0,
      checked,
      eligible,
      sent,
      skipped,
      failed,
      errors: [...errors, msg],
    };
  }
}
