import { describe, expect, it } from "vitest";

import {
  buildAutoFollowupDedupeKey,
  getCallbackAutoFollowupSkipReason,
  isCallbackEligibleForAutoFollowup,
} from "@/features/commercial-callbacks/lib/callback-auto-followup-rules";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function row(over: Partial<CommercialCallbackRow>): CommercialCallbackRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    company_name: "ACME",
    contact_name: "Jean",
    phone: "0600000000",
    email: "a@b.com",
    callback_date: "2026-04-15",
    callback_time: "10:00:00",
    callback_time_window: null,
    callback_comment: "Relance",
    status: "no_answer",
    priority: "normal",
    source: null,
    assigned_agent_user_id: null,
    created_by_user_id: null,
    updated_by_user_id: null,
    converted_lead_id: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    attempts_count: 1,
    last_call_at: null,
    call_started_at: null,
    call_context_summary: null,
    prospect_temperature: null,
    estimated_value_cents: null,
    estimated_value_eur: null,
    sequence_step: 0,
    sequence_type: null,
    sequence_next_at: null,
    callback_reason: null,
    callback_preferred_period: null,
    callback_outcome: null,
    due_at: null,
    next_reminder_at: null,
    snoozed_until: null,
    completed_at: null,
    cancelled_at: null,
    business_score: null,
    confidence_score: null,
    ai_script_text: null,
    ai_followup_draft: null,
    ai_last_generated_at: null,
    in_progress_by_user_id: null,
    last_notification_at: null,
    last_in_app_alert_at: null,
    auto_followup_enabled: true,
    auto_followup_last_sent_at: null,
    auto_followup_count: 0,
    auto_followup_status: null,
    auto_followup_next_eligible_at: null,
    last_outbound_email_at: null,
    initial_contact_email_sent: false,
    ...over,
  };
}

describe("callback-auto-followup-rules", () => {
  const now = new Date("2026-04-15T12:00:00.000Z");

  it("refuse sans e-mail", () => {
    const r = isCallbackEligibleForAutoFollowup(row({ email: null }), { now });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("no_email");
  });

  it("refuse si terminal", () => {
    const r = isCallbackEligibleForAutoFollowup(row({ status: "completed" }), { now });
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("terminal_status");
  });

  it("refuse opposition explicite", () => {
    const r = isCallbackEligibleForAutoFollowup(
      row({ status: "no_answer", callback_comment: "Refus catégorique, ne pas rappeler." }),
      { now },
    );
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("prospect_opposition");
  });

  it("accepte no_answer avec e-mail", () => {
    const r = isCallbackEligibleForAutoFollowup(row({ status: "no_answer", email: "x@y.fr" }), { now });
    expect(r.eligible).toBe(true);
    expect(r.suggestedType).toBe("no_answer_followup");
  });

  it("refuse au-delà du max", () => {
    const r = isCallbackEligibleForAutoFollowup(
      row({ status: "no_answer", email: "x@y.fr", auto_followup_count: 3 }),
      { now, maxAutoFollowups: 3 },
    );
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("max_auto_followups_reached");
  });

  it("getCallbackAutoFollowupSkipReason aligné", () => {
    expect(getCallbackAutoFollowupSkipReason(row({ email: null }), { now })).toBe("no_email");
  });

  it("dedupe key stable", () => {
    expect(buildAutoFollowupDedupeKey("id1", "no_answer_followup", "2026-04-15")).toBe(
      "callback-auto-followup:id1:no_answer_followup:2026-04-15",
    );
  });

  it("refuse si cooldown actif", () => {
    const r = isCallbackEligibleForAutoFollowup(
      row({
        status: "no_answer",
        email: "x@y.fr",
        auto_followup_last_sent_at: "2026-04-15T10:00:00.000Z",
      }),
      { now: new Date("2026-04-15T20:00:00.000Z"), minHoursBetweenSends: 48 },
    );
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe("cooldown_active");
  });
});
