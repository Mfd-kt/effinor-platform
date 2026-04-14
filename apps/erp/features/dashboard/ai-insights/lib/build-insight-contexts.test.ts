import { describe, expect, it } from "vitest";

import { buildAdminInsightContext, buildDirectorInsightContext } from "@/features/dashboard/ai-insights/lib/build-insight-contexts";
import type { CockpitBundle } from "@/features/dashboard/queries/get-cockpit-bundle";
import { CEE_WORKFLOW_STATUS_VALUES } from "@/features/cee-workflows/domain/constants";

function emptyFunnel() {
  const base = { total: 0 } as CockpitBundle["snapshot"]["funnel"];
  for (const s of CEE_WORKFLOW_STATUS_VALUES) {
    (base as Record<string, number>)[s] = 0;
  }
  return base;
}

function minimalBundle(): CockpitBundle {
  const funnel = emptyFunnel();
  const snapshot: CockpitBundle["snapshot"] = {
    funnel,
    bySheet: [
      {
        sheetId: "s1",
        sheetCode: "A",
        sheetLabel: "Fiche A",
        workflowCount: 20,
        byStatus: { simulation_done: 8, to_confirm: 4 },
        signed: 1,
        lost: 2,
        sent: 3,
      },
    ],
    byTeam: [],
    byChannel: [{ channel: "web", workflowCount: 15, qualifiedPlus: 10, signed: 2 }],
    priorityQueues: {
      staleDrafts: [],
      blockedConfirm: [],
      docsPreparedStale: [],
      agreementsAwaitingSign: [],
      oldAgreementSent: [],
    },
  };
  return {
    filters: {
      ceeSheetId: null,
      teamId: null,
      leadChannel: null,
      period: "days30",
    },
    filterOptions: { sheets: [], teams: [], channels: [] },
    periodRange: { startIso: "2026-04-01T00:00:00.000Z", endIso: "2026-04-11T00:00:00.000Z" },
    leadsCreatedInPeriod: 10,
    leadsCreatedPrevious: 12,
    snapshot,
    snapshotPeriod: snapshot,
    periodAlerts: [],
    structuralAlerts: [],
    teamsWithoutCloser: [{ teamId: "t1", teamName: "T", sheetLabel: "S" }],
    sheetsWithoutTeam: [],
    networkOverview: null,
  };
}

describe("buildAdminInsightContext", () => {
  it("computes backlog concentration by sheet", () => {
    const ctx = buildAdminInsightContext(minimalBundle());
    expect(ctx.backlogBySheet[0]?.label).toBe("Fiche A");
    expect(ctx.backlogBySheet[0]?.count).toBe(12);
    expect(ctx.teamsWithoutCloser).toBe(1);
    expect(ctx.leadsCreated.current).toBe(10);
    expect(ctx.leadsCreated.previous).toBe(12);
  });
});

describe("buildDirectorInsightContext", () => {
  it("exposes sheet rollup and optional funnel leak", () => {
    const b = minimalBundle();
    b.snapshot.funnel.docs_prepared = 10;
    b.snapshot.funnel.to_close = 2;
    b.snapshot.funnel.agreement_sent = 2;
    const ctx = buildDirectorInsightContext(b);
    expect(ctx.sheetRollup.length).toBeGreaterThan(0);
    expect(ctx.funnelLeakHint).not.toBeNull();
  });
});
