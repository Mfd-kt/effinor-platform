import { describe, expect, it } from "vitest";

import { buildAiOpsDedupeKey } from "@/features/ai-ops-agent/lib/ai-ops-dedupe";
import { buildSlaBreachHumanMessage } from "@/features/ai-ops-agent/detect-sla-from-internal-sla";

import { computeSlaDueDatesForEntity } from "./compute-sla-instance";
import { evaluateSlaState } from "./evaluate-sla-state";
import type { InternalSlaRuleRow } from "./sla-types";

function ruleCbCritical(): InternalSlaRuleRow {
  return {
    code: "cb_critical_2h",
    name: "Rappel critique",
    entity_type: "callback",
    role_target: "commercial",
    condition_json: {},
    target_delay_minutes: 90,
    warning_delay_minutes: 60,
    critical_delay_minutes: 120,
    action_policy: "notify",
    is_active: true,
  };
}

describe("evaluateSlaState", () => {
  it("healthy → warning → breached → critical selon l’horloge", () => {
    const anchor = new Date("2026-04-11T10:00:00.000Z");
    const dues = computeSlaDueDatesForEntity(ruleCbCritical(), anchor, {});
    expect(dues).not.toBeNull();
    const { warningDueAt, targetDueAt, criticalDueAt } = dues!;

    expect(evaluateSlaState(warningDueAt, targetDueAt, criticalDueAt, new Date("2026-04-11T10:30:00.000Z"))).toBe(
      "healthy",
    );
    expect(evaluateSlaState(warningDueAt, targetDueAt, criticalDueAt, new Date("2026-04-11T11:05:00.000Z"))).toBe(
      "warning",
    );
    expect(evaluateSlaState(warningDueAt, targetDueAt, criticalDueAt, new Date("2026-04-11T11:35:00.000Z"))).toBe(
      "breached",
    );
    expect(evaluateSlaState(warningDueAt, targetDueAt, criticalDueAt, new Date("2026-04-11T12:05:00.000Z"))).toBe(
      "critical",
    );
  });
});

describe("buildSlaBreachHumanMessage", () => {
  it("mentionne la règle et le retard en langage métier", () => {
    const body = buildSlaBreachHumanMessage({
      ruleName: "Lead simulateur",
      status: "breached",
      minutesLate: 45,
      entityType: "lead",
      entityLabel: "ACME",
    });
    expect(body).toContain("Lead simulateur");
    expect(body).toContain("45 min");
    expect(body).toContain("ACME");
  });
});

describe("buildAiOpsDedupeKey sla_breach", () => {
  it("inclut rule_code, entité et utilisateur cible", () => {
    const k = buildAiOpsDedupeKey({
      targetUserId: "user-1",
      roleTarget: "commercial",
      issueType: "sla_breach",
      topic: "x",
      priority: "high",
      messageType: "alert",
      body: "y",
      requiresAction: true,
      entityType: "lead",
      entityId: "lead-2",
      metadataJson: { rule_code: "lead_sim_1h" },
    });
    expect(k).toBe("sla:lead_sim_1h:lead:lead-2:user-1");
  });
});
