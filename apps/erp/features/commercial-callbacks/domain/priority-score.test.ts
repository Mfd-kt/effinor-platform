import { describe, expect, it } from "vitest";

import { computeCallbackPriorityScore } from "@/features/commercial-callbacks/domain/priority-score";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function baseRow(over: Partial<CommercialCallbackRow>): CommercialCallbackRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    company_name: "ACME",
    contact_name: "Jean",
    phone: "0600000000",
    email: null,
    callback_date: "2030-01-01",
    callback_time: null,
    callback_time_window: null,
    callback_comment: "x",
    status: "pending",
    priority: "normal",
    source: null,
    assigned_agent_user_id: null,
    created_by_user_id: null,
    updated_by_user_id: null,
    converted_lead_id: null,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    attempts_count: 0,
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

describe("computeCallbackPriorityScore", () => {
  it("classe un rappel en retard au-dessus d’un rappel futur", () => {
    const now = new Date("2026-04-15T12:00:00.000Z");
    const overdue = baseRow({
      callback_date: "2026-04-10",
      callback_time: "09:00:00",
      status: "pending",
    });
    const future = baseRow({
      id: "00000000-0000-4000-8000-000000000002",
      callback_date: "2026-04-20",
      status: "pending",
    });
    expect(computeCallbackPriorityScore(overdue, now)).toBeGreaterThan(
      computeCallbackPriorityScore(future, now),
    );
  });

  it("booste un prospect chaud", () => {
    const now = new Date("2026-04-15T12:00:00.000Z");
    const cold = baseRow({
      callback_date: "2026-04-16",
      prospect_temperature: "cold",
    });
    const hot = baseRow({
      id: "00000000-0000-4000-8000-000000000003",
      callback_date: "2026-04-16",
      prospect_temperature: "hot",
    });
    expect(computeCallbackPriorityScore(hot, now)).toBeGreaterThan(computeCallbackPriorityScore(cold, now));
  });
});
