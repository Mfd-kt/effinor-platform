import { describe, expect, it } from "vitest";

import { buildCallbackAgentContextSections, buildCallbackAiContext } from "@/features/commercial-callbacks/ai/build-callback-ai-context";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function baseRow(over: Partial<CommercialCallbackRow>): CommercialCallbackRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    company_name: "ACME",
    contact_name: "Jean Dupont",
    phone: "0600000000",
    email: null,
    callback_date: "2026-04-15",
    callback_time: "14:00:00",
    callback_time_window: null,
    callback_comment: "Souhaite un chiffrage avant fin du mois.",
    status: "pending",
    priority: "high",
    source: "salon",
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
    call_context_summary: "Intéressé par déstratification.",
    prospect_temperature: "warm",
    estimated_value_cents: null,
    estimated_value_eur: 15000,
    sequence_step: 0,
    sequence_type: null,
    sequence_next_at: null,
    callback_reason: "Relance devis",
    callback_preferred_period: "afternoon",
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

describe("buildCallbackAiContext", () => {
  it("expose why_now, agent_goal et ton sans jargon code statut", () => {
    const now = new Date("2026-04-15T10:00:00.000Z");
    const ctx = buildCallbackAiContext(
      baseRow({ status: "due_today", callback_date: "2026-04-15" }),
      undefined,
      now,
    );
    expect(ctx.whyNow.length).toBeGreaterThan(10);
    expect(ctx.agentGoal.length).toBeGreaterThan(10);
    expect(["direct", "rassurant", "relance_legere"]).toContain(ctx.recommendedTone);
    expect(ctx.statusLabel).toContain("priorité");
    expect(ctx.statusLabel.toLowerCase()).not.toContain("to_confirm");
  });

  it("inclut l’extra fiche CEE dans le contexte", () => {
    const ctx = buildCallbackAiContext(
      baseRow({}),
      { ceeSheetCode: "BAR-TH-171", ceeSheetLabel: "Déstratification" },
    );
    expect(ctx.ceeSheetHint).toContain("BAR-TH-171");
    expect(ctx.ceeSheetHint).toContain("Déstratification");
  });
});

describe("buildCallbackAgentContextSections", () => {
  it("retourne des sections lisibles avec titres distincts", () => {
    const ctx = buildCallbackAiContext(baseRow({}));
    const sections = buildCallbackAgentContextSections(ctx);
    const titles = sections.map((s) => s.title);
    expect(titles).toContain("Priorité & statut");
    expect(sections.every((s) => s.body.trim().length > 0)).toBe(true);
  });
});
