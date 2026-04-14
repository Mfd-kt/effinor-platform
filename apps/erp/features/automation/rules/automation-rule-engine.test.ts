import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import { evaluateAutomationRuleForSlack, shouldSendSlackSmartAlert } from "./automation-rule-engine";

function baseAlert(over: Partial<CockpitAlert> = {}): CockpitAlert {
  return {
    id: "a1",
    scope: "period",
    severity: "warning",
    category: "backlog",
    title: "Test",
    message: "Msg",
    description: "Msg",
    suggestedAction: "Agir",
    targetType: "global",
    targetId: null,
    targetLabel: null,
    metricValue: 5,
    thresholdValue: 3,
    comparisonValue: null,
    period: "30 jours",
    roleAudience: ["manager"],
    priorityScore: 1,
    sortScore: 1,
    topWorkflows: [],
    estimatedImpactEuro: 1000,
    workflowsCount: 2,
    priorityLevel: "medium",
    cta: { label: "Voir", href: "/" },
    ...over,
  };
}

describe("evaluateAutomationRuleForSlack", () => {
  it("envoie sur critical", () => {
    const d = evaluateAutomationRuleForSlack(baseAlert({ severity: "critical" }));
    expect(d.slack).toBe(true);
  });

  it("envoie sur warning + enjeu élevé", () => {
    const d = evaluateAutomationRuleForSlack(
      baseAlert({ severity: "warning", estimatedImpactEuro: 10_000 }),
    );
    expect(d.slack).toBe(true);
  });

  it("n’envoie pas sur warning faible sans autre critère", () => {
    const d = evaluateAutomationRuleForSlack(
      baseAlert({ severity: "warning", estimatedImpactEuro: 100, priorityLevel: "low" }),
    );
    expect(d.slack).toBe(false);
  });
});

describe("shouldSendSlackSmartAlert", () => {
  beforeEach(() => {
    vi.stubEnv("AUTOMATION_SLACK_SMART_ENABLED", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retourne false si désactivé", () => {
    vi.stubEnv("AUTOMATION_SLACK_SMART_ENABLED", "false");
    expect(shouldSendSlackSmartAlert(baseAlert({ severity: "critical" }))).toBe(false);
  });

  it("retourne true si activé et critical", () => {
    expect(shouldSendSlackSmartAlert(baseAlert({ severity: "critical" }))).toBe(true);
  });
});
