import { describe, expect, it } from "vitest";

import { buildAgentDigest } from "./build-agent-digest";
import { buildConfirmateurDigest } from "./build-confirmateur-digest";
import { buildDirectionDigest } from "./build-direction-digest";
import { buildDigestDedupeKey, shouldGenerateDigest } from "./digest-delivery-rules";
import { parisYmd } from "./digest-helpers";
import type { RoleDigest } from "./digest-types";
import type { RoleDigestLoaderSnapshot } from "./load-role-digest-data";

function baseSnapshot(overrides: Partial<RoleDigestLoaderSnapshot>): RoleDigestLoaderSnapshot {
  const now = new Date("2026-04-11T12:00:00.000Z");
  return {
    roleTarget: "agent",
    userId: "u1",
    now,
    aiOpsBrief: { openConversations: 0, escalatedCount: 0 },
    ...overrides,
  };
}

describe("shouldGenerateDigest", () => {
  it("refuse un digest sans contenu utile", () => {
    const d: RoleDigest = {
      id: "1",
      roleTarget: "agent",
      targetUserId: "u",
      title: "t",
      summary: "short",
      priority: "low",
      sections: [],
      actionItems: [],
      generatedAt: new Date().toISOString(),
    };
    expect(shouldGenerateDigest(d)).toBe(false);
  });

  it("accepte sections + résumé substantiel", () => {
    const d: RoleDigest = {
      id: "1",
      roleTarget: "agent",
      targetUserId: "u",
      title: "t",
      summary: "Tu as 2 rappels à traiter aujourd’hui.",
      priority: "normal",
      sections: [{ key: "a", title: "A", items: ["un point"] }],
      actionItems: [],
      generatedAt: new Date().toISOString(),
    };
    expect(shouldGenerateDigest(d)).toBe(true);
  });
});

describe("buildDigestDedupeKey", () => {
  it("est stable pour le même contenu", () => {
    const d: RoleDigest = {
      id: "x",
      roleTarget: "agent",
      targetUserId: "u1",
      title: "t",
      summary: "Résumé identique",
      priority: "normal",
      sections: [{ key: "s", title: "S", items: ["a", "b"] }],
      actionItems: [
        {
          id: "act1",
          label: "L",
          description: "D",
          actionType: "open",
          actionHref: "/x",
          phone: null,
          impactEuro: null,
          priority: "normal",
        },
      ],
      generatedAt: "2026-04-11T10:00:00.000Z",
    };
    const day = "2026-04-11";
    expect(buildDigestDedupeKey(d, day)).toBe(buildDigestDedupeKey({ ...d, id: "y" }, day));
  });
});

describe("buildAgentDigest", () => {
  it("produit un digest non vide avec retard et lead chaud", () => {
    const s = baseSnapshot({
      roleTarget: "agent",
      agentCallbacks: [
        {
          id: "cb1",
          company_name: "ACME",
          status: "overdue",
          callback_date: "2026-04-01",
          callback_time: null,
          priority: "normal",
          phone: "0600000000",
          estimated_value_eur: 9000,
          business_score: 50,
          created_at: "2026-04-01T10:00:00Z",
        } as import("@/features/commercial-callbacks/types").CommercialCallbackRow,
      ],
      agentHotLeads: [
        {
          id: "l1",
          company_name: "HotCo",
          phone: null,
          simulated_at: "2026-04-11T08:00:00Z",
          sim_saving_eur_30_selected: 1200,
        },
      ],
    });
    const d = buildAgentDigest(s);
    expect(d).not.toBeNull();
    expect(shouldGenerateDigest(d)).toBe(true);
    expect(d!.actionItems.length).toBeGreaterThan(0);
    expect(d!.actionItems.some((a) => a.actionHref)).toBe(true);
  });
});

describe("buildConfirmateurDigest", () => {
  it("mentionne backlog et SLA", () => {
    const s = baseSnapshot({
      roleTarget: "confirmateur",
      confirmateurBacklog: [
        {
          id: "w1",
          lead_id: "l9",
          workflow_status: "to_confirm",
          updated_at: "2026-04-01T10:00:00Z",
          agreement_sent_at: null,
          assigned_confirmateur_user_id: "u1",
          assigned_closer_user_id: null,
        },
      ],
      confirmateurSla: [
        {
          id: "sla1",
          rule_code: "wf_confirmateur_24h",
          entity_type: "workflow",
          entity_id: "w1",
          status: "breached",
          target_due_at: "2026-04-10T10:00:00Z",
          assigned_user_id: "u1",
          manager_user_id: null,
        },
      ],
    });
    const d = buildConfirmateurDigest(s);
    expect(d).not.toBeNull();
    expect(d!.summary).toMatch(/backlog|SLA|dépassement/i);
    expect(d!.sections.some((x) => x.key === "sla")).toBe(true);
  });
});

describe("buildDirectionDigest", () => {
  it("met en avant risques et cash", () => {
    const s = baseSnapshot({
      roleTarget: "direction",
      directionLeadsToday: 0,
      directionAutomationFailed48h: 3,
      directionSlaCritical: 2,
      directionHighValueOverdue: 4,
      directionSheetsWithoutTeam: 3,
      directionAiExecutedToday: 5,
      directionUnassignedWorkflows: 4,
    });
    const d = buildDirectionDigest(s);
    expect(d).not.toBeNull();
    expect(d!.sections.find((x) => x.key === "risks")?.items.length).toBeGreaterThan(0);
    expect(d!.priority === "critical" || d!.priority === "high").toBe(true);
    expect(d!.actionItems[0].actionHref).toBeTruthy();
  });
});

describe("parisYmd", () => {
  it("retourne une date YYYY-MM-DD", () => {
    expect(parisYmd(new Date("2026-04-11T12:00:00.000Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
