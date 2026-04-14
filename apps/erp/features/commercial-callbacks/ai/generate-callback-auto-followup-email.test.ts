import { describe, expect, it, vi, afterEach } from "vitest";

import { generateCallbackAutoFollowupEmail } from "@/features/commercial-callbacks/ai/generate-callback-auto-followup-email";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function minimal(over: Partial<CommercialCallbackRow>): CommercialCallbackRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    company_name: "Co",
    contact_name: "Jean",
    phone: "06",
    email: "a@b.com",
    callback_date: "2026-04-15",
    callback_time: null,
    callback_time_window: null,
    callback_comment: "Test",
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

describe("generateCallbackAutoFollowupEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fallback sans OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const out = await generateCallbackAutoFollowupEmail(minimal({}), "no_answer_followup");
    expect(out.source).toBe("fallback");
    expect(out.subject.length).toBeGreaterThan(3);
    expect(out.htmlBody.length).toBeGreaterThan(10);
    expect(out.textBody.length).toBeGreaterThan(10);
  });
});
