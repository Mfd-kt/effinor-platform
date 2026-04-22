import { describe, expect, it } from "vitest";

import type { CockpitDataForAi } from "./build-cockpit-ai-context";
import { buildCockpitAiContext } from "./build-cockpit-ai-context";
import { buildCockpitAiRecommendationsFallback } from "./cockpit-ai-fallback";
import { computeCockpitRecommendationPriority, sortAiRecommendations } from "./cockpit-ai-priority";
import type { CockpitAiRecommendation } from "../types";

function emptyPerformance() {
  return { agents: [], closers: [] };
}

function baseData(overrides: Partial<CockpitDataForAi> = {}): CockpitDataForAi {
  return {
    humanAnomalies: [],
    workflowLogMetrics: {
      closerMedianHours: null,
      conversionRateFromLogsPct: null,
      conversionNumerator: 0,
      conversionDenominator: 0,
    },
    workflowJournalPreview: [],
    cashImmediate: [],
    sheetsWithoutTeam: [],
    hotSimulatedLeads24h: 0,
    workflowStuckBySheet: [],
    filterOptions: { teams: [], sheets: [] },
    teamMembersByTeam: {},
    alerts: [],
    opportunities: [],
    callbacks: {
      kpis: {
        dueToday: 0,
        overdue: 0,
        upcoming: 0,
        completedToday: 0,
      },
      performance: {
        conversionRate: null,
        noAnswerOrColdShare: null,
        treatedToday: 0,
      },
      overdue: [],
      critical: [],
      highValue: [],
    },
    pipeline: {
      awaitCloser: 0,
      unassignedAgent: 0,
      staleDrafts: 0,
      docsPreparedStale: 0,
      oldAgreementSent: 0,
      blockedCount: 0,
      sampleBlocked: [],
      stageLatency: {
        awaitCloserAvgDays: null,
        unassignedAvgDays: null,
        blockedAvgDays: null,
        alerts: [],
      },
    },
    automation: {
      windowHours: 48,
      totalRuns: 0,
      success: 0,
      skipped: 0,
      failed: 0,
      slackAttempts: 0,
      slackFailed: 0,
      emailFailed: 0,
      health: "ok",
      callbackAutoFollowup: { runs: 0, sent: 0, skipped: 0, failed: 0 },
      cronHealthy: true,
      recentErrors: [],
    },
    logs: { lines: [] },
    performance: emptyPerformance(),
    aiExecutionHints: { autoAssignAgent: null },
    internalSla: null,
    ...overrides,
  };
}

describe("computeCockpitRecommendationPriority", () => {
  it("classe un callback 8k€ en retard comme critique ou important", () => {
    const r = computeCockpitRecommendationPriority({
      overdue: true,
      valueCents: 800_000,
      callbackScore: 80,
    });
    expect(["critical", "important"]).toContain(r.priority);
    expect(r.confidence).toBeGreaterThanOrEqual(50);
    expect(r.reasonCodes.length).toBeGreaterThan(0);
  });

  it("attribue une confiance raisonnable pour une fiche qui bloque beaucoup", () => {
    const r = computeCockpitRecommendationPriority({
      configBlocksWorkflows: 15,
    });
    expect(r.priority).toBe("critical");
    expect(r.confidence).toBeGreaterThanOrEqual(70);
  });
});

describe("sortAiRecommendations", () => {
  it("trie critique avant opportunité", () => {
    const rows: CockpitAiRecommendation[] = [
      {
        id: "b",
        title: "B",
        description: "",
        category: "cash",
        priority: "opportunity",
        impactEuro: 100,
        confidence: 90,
        reasonCodes: [],
        relatedEntityType: "system",
        relatedEntityId: null,
        actionLabel: null,
        actionHref: null,
        phone: null,
        executable: false,
        actionType: "view_automation",
        actionPayload: {},
        executionStatus: "idle",
        executionMessage: null,
      },
      {
        id: "a",
        title: "A",
        description: "",
        category: "cash",
        priority: "critical",
        impactEuro: 10,
        confidence: 60,
        reasonCodes: [],
        relatedEntityType: "system",
        relatedEntityId: null,
        actionLabel: null,
        actionHref: null,
        phone: null,
        executable: false,
        actionType: "view_automation",
        actionPayload: {},
        executionStatus: "idle",
        executionMessage: null,
      },
    ];
    const s = sortAiRecommendations(rows);
    expect(s[0]!.id).toBe("a");
  });
});

describe("buildCockpitAiRecommendationsFallback", () => {
  it("produit une reco automation si cron KO (sans OpenAI)", () => {
    const data = baseData({
      automation: {
        windowHours: 48,
        totalRuns: 10,
        success: 5,
        skipped: 0,
        failed: 5,
        slackAttempts: 0,
        slackFailed: 0,
        emailFailed: 0,
        health: "problem",
        callbackAutoFollowup: { runs: 0, sent: 0, skipped: 0, failed: 0 },
        cronHealthy: false,
        recentErrors: [],
      },
    });
    const ctx = buildCockpitAiContext(data);
    const recs = buildCockpitAiRecommendationsFallback(ctx, data);
    const auto = recs.find((r) => r.id === "ai:automation-cron-health");
    expect(auto).toBeDefined();
    expect(auto?.category).toBe("automation");
  });

  it("produit une reco fiche mal configurée", () => {
    const data = baseData({
      sheetsWithoutTeam: [{ sheetId: "s1", label: "BAT-TH-142" }],
    });
    const ctx = buildCockpitAiContext(data);
    const recs = buildCockpitAiRecommendationsFallback(ctx, data);
    expect(recs.some((r) => r.id === "ai:config-sheet:s1")).toBe(true);
    const r = recs.find((x) => x.id === "ai:config-sheet:s1")!;
    expect(r.relatedEntityType).toBe("sheet");
    expect(r.impactEuro).toBeNull();
  });

  it("callbacks haute valeur overdue génèrent un lot ou un appel", () => {
    const data = baseData({
      opportunities: [
        {
          kind: "callback",
          id: "cb1",
          company: "ACME",
          score: 88,
          estimatedValueEur: 8500,
          valueCents: 850_000,
          href: "/commercial-callbacks",
          phone: "+33600000000",
          statusLabel: "Retard",
          canConvert: true,
          teamId: null,
          sheetId: null,
          assignedAgentUserId: null,
          createdByAgentId: null,
          overdueCallback: true,
        },
        {
          kind: "callback",
          id: "cb2",
          company: "BETA",
          score: 90,
          estimatedValueEur: 9000,
          valueCents: 900_000,
          href: "/commercial-callbacks",
          phone: null,
          statusLabel: "Retard",
          canConvert: true,
          teamId: null,
          sheetId: null,
          assignedAgentUserId: null,
          createdByAgentId: null,
          overdueCallback: true,
        },
      ],
      callbacks: {
        kpis: { dueToday: 0, overdue: 2, upcoming: 0, completedToday: 0 },
        performance: {
          conversionRate: null,
          noAnswerOrColdShare: null,
          treatedToday: 0,
        },
        overdue: [],
        critical: [],
        highValue: [],
      },
    });
    const ctx = buildCockpitAiContext(data);
    const recs = buildCockpitAiRecommendationsFallback(ctx, data);
    const batch = recs.find((r) => r.id === "ai:callbacks-overdue-hv-batch");
    const calls = recs.filter((r) => r.id.startsWith("ai:callback-call:"));
    expect(batch != null || calls.length > 0).toBe(true);
    const withPhone = calls.find((r) => r.phone);
    if (withPhone) {
      expect(withPhone.impactEuro).toBeGreaterThan(0);
    }
  });

  it("ne lève pas sans données (smoke)", () => {
    const data = baseData();
    const ctx = buildCockpitAiContext(data);
    expect(() => buildCockpitAiRecommendationsFallback(ctx, data)).not.toThrow();
    expect(Array.isArray(buildCockpitAiRecommendationsFallback(ctx, data))).toBe(true);
  });
});
