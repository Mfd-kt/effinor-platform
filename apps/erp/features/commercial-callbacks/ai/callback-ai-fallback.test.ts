import { describe, expect, it, vi, afterEach } from "vitest";

import { buildCallbackAiContext } from "@/features/commercial-callbacks/ai/build-callback-ai-context";
import {
  fallbackCallbackCallScript,
  fallbackCallbackFollowupDraft,
} from "@/features/commercial-callbacks/ai/callback-ai-fallback";
import { generateCallbackCallScript } from "@/features/commercial-callbacks/ai/generate-callback-call-script";
import { generateCallbackFollowupDraft } from "@/features/commercial-callbacks/ai/generate-callback-followup-draft";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function minimalRow(over: Partial<CommercialCallbackRow>): CommercialCallbackRow {
  return {
    id: "00000000-0000-4000-8000-000000000099",
    company_name: "TestCo",
    contact_name: "Marie Martin",
    phone: "0612345678",
    email: "m@example.com",
    callback_date: "2026-05-01",
    callback_time: null,
    callback_time_window: null,
    callback_comment: "Le prospect était occupé, rappeler demain matin.",
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

describe("fallbackCallbackCallScript", () => {
  it("produit 3 à 6 lignes utilisables", () => {
    const ctx = buildCallbackAiContext(minimalRow({}));
    const { lines } = fallbackCallbackCallScript(ctx);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.length).toBeLessThanOrEqual(6);
    expect(lines.join(" ")).toMatch(/Effinor|effinor/i);
  });
});

describe("fallbackCallbackFollowupDraft", () => {
  it("produit objet, message et CTA", () => {
    const ctx = buildCallbackAiContext(minimalRow({}));
    const d = fallbackCallbackFollowupDraft(ctx);
    expect(d.subject.length).toBeGreaterThan(3);
    expect(d.message.length).toBeGreaterThan(10);
    expect(d.cta.length).toBeGreaterThan(5);
    expect(d.fullText).toContain("Objet :");
  });
});

describe("generateCallback sans OpenAI", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("utilise le fallback si OPENAI_API_KEY est absente", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const row = minimalRow({});
    const script = await generateCallbackCallScript(row);
    expect(script.source).toBe("fallback");
    expect(script.scriptText.split("\n").length).toBeGreaterThanOrEqual(3);

    const draft = await generateCallbackFollowupDraft(row);
    expect(draft.source).toBe("fallback");
    expect(draft.draftText.length).toBeGreaterThan(20);
  });
});
