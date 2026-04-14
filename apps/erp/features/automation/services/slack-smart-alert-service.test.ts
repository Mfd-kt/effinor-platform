import { describe, expect, it } from "vitest";

import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import { mapCockpitAlertToAutomationEventType } from "@/features/notifications/domain/slack-automation-routing";
import { buildSlackSmartAlertDedupeKey, buildSlackSmartAlertPayload } from "./slack-smart-alert-service";

function minimalAlert(over: Partial<CockpitAlert> = {}): CockpitAlert {
  return {
    id: "x",
    scope: "period",
    severity: "warning",
    category: "backlog",
    title: "T",
    message: "M",
    description: "M",
    suggestedAction: "S",
    targetType: "global",
    targetId: null,
    targetLabel: null,
    metricValue: null,
    thresholdValue: null,
    comparisonValue: null,
    period: null,
    roleAudience: ["all"],
    priorityScore: 1,
    sortScore: 1,
    topWorkflows: [],
    estimatedImpactEuro: null,
    workflowsCount: 0,
    priorityLevel: "medium",
    cta: { label: "Ouvrir", href: "/leads" },
    ...over,
  };
}

describe("mapCockpitAlertToAutomationEventType (routage Slack)", () => {
  it("staffing → no_team_member", () => {
    expect(mapCockpitAlertToAutomationEventType(minimalAlert({ category: "staffing" }))).toBe("no_team_member");
  });

  it("followup → closing_followup", () => {
    expect(mapCockpitAlertToAutomationEventType(minimalAlert({ category: "followup" }))).toBe("closing_followup");
  });

  it("critical → critical_alert", () => {
    expect(
      mapCockpitAlertToAutomationEventType(minimalAlert({ severity: "critical", category: "followup" })),
    ).toBe("critical_alert");
  });
});

describe("buildSlackSmartAlertDedupeKey", () => {
  it("inclut l’id alerte et le jour UTC", () => {
    const k = buildSlackSmartAlertDedupeKey(minimalAlert({ id: "alert-42" }));
    expect(k.startsWith("slack-smart:alert-42:")).toBe(true);
  });
});

describe("buildSlackSmartAlertPayload", () => {
  it("préfixe le titre et conserve un lien", () => {
    const p = buildSlackSmartAlertPayload(
      minimalAlert({ title: "Backlog", cta: { label: "File", href: "/cockpit" } }),
    );
    expect(p.title).toContain("[Cockpit]");
    expect(p.actionUrl).toContain("cockpit");
    expect(p.metadata?.slackAutomationEventType).toBeDefined();
  });
});
