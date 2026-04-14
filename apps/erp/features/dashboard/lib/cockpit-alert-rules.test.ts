import { describe, expect, it } from "vitest";

import type { CockpitFunnelCounts, CockpitWorkflowSnapshot } from "@/features/dashboard/domain/cockpit";
import { CEE_WORKFLOW_STATUS_VALUES } from "@/features/cee-workflows/domain/constants";
import {
  activityDropSeverity,
  isBacklogCritical,
  isRateBelowThreshold,
  lossRateJumpSeverity,
} from "@/features/dashboard/lib/cockpit-alert-helpers";
import { COCKPIT_ALERT_THRESHOLDS as T } from "@/features/dashboard/lib/cockpit-alert-thresholds";
import {
  buildPeriodBusinessAlerts,
  buildStructuralBusinessAlerts,
  filterCockpitAlertsForVariant,
  sortCockpitAlerts,
} from "@/features/dashboard/lib/cockpit-alert-rules";
import type { CockpitAlert } from "@/features/dashboard/domain/cockpit";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

function emptyFunnel(): CockpitFunnelCounts {
  const base = { total: 0 } as CockpitFunnelCounts;
  for (const s of CEE_WORKFLOW_STATUS_VALUES) {
    (base as Record<string, number>)[s] = 0;
  }
  return base;
}

function minimalSnapshot(overrides: Partial<CockpitWorkflowSnapshot> = {}): CockpitWorkflowSnapshot {
  const funnel = emptyFunnel();
  return {
    funnel,
    bySheet: [],
    byTeam: [],
    byChannel: [],
    priorityQueues: {
      staleDrafts: [],
      blockedConfirm: [],
      docsPreparedStale: [],
      agreementsAwaitingSign: [],
      oldAgreementSent: [],
    },
    ...overrides,
  };
}

describe("cockpit alert helpers", () => {
  it("isBacklogCritical respects warning and critical counts", () => {
    expect(isBacklogCritical(5, 15, 30)).toBe("ok");
    expect(isBacklogCritical(16, 15, 30)).toBe("warning");
    expect(isBacklogCritical(31, 15, 30)).toBe("critical");
  });

  it("isRateBelowThreshold orders warning vs critical for sign rate", () => {
    expect(isRateBelowThreshold(0.2, T.conversion.signRateWarning, T.conversion.signRateCritical)).toBe("ok");
    expect(isRateBelowThreshold(0.1, T.conversion.signRateWarning, T.conversion.signRateCritical)).toBe("warning");
    expect(isRateBelowThreshold(0.05, T.conversion.signRateWarning, T.conversion.signRateCritical)).toBe("critical");
  });

  it("activityDropSeverity needs sufficient previous volume", () => {
    expect(activityDropSeverity(5, 4, 25, 45, 5)).toBe("ok");
    expect(activityDropSeverity(7, 10, 25, 45, 5)).toBe("warning");
    expect(activityDropSeverity(4, 10, 25, 45, 5)).toBe("critical");
  });

  it("lossRateJumpSeverity detects abnormal increase", () => {
    expect(lossRateJumpSeverity(0.2, 0.15, 0.12, 0.2)).toBe("ok");
    expect(lossRateJumpSeverity(0.3, 0.15, 0.12, 0.2)).toBe("warning");
    expect(lossRateJumpSeverity(0.45, 0.15, 0.12, 0.2)).toBe("critical");
  });
});

describe("buildStructuralBusinessAlerts", () => {
  it("flags active sheet missing simulator and templates", () => {
    const alerts = buildStructuralBusinessAlerts({
      basePath: "",
      sheets: [
        {
          id: "s1",
          code: "X",
          label: "Fiche X",
          simulatorKey: null,
          workflowKey: null,
          presentationTemplateKey: null,
          agreementTemplateKey: null,
          isCommercialActive: true,
        },
      ],
      teams: [
        { id: "t1", name: "Team", ceeSheetId: "s1", isActive: true },
      ],
      members: [
        { ceeSheetTeamId: "t1", roleInTeam: "agent", isActive: true },
        { ceeSheetTeamId: "t1", roleInTeam: "confirmateur", isActive: true },
        { ceeSheetTeamId: "t1", roleInTeam: "closer", isActive: true },
      ],
    });
    const mis = alerts.find((a) => a.id === "struct-sheet-misconfigured-s1");
    expect(mis).toBeDefined();
    expect(mis?.severity).toBe("critical");
    expect(mis?.category).toBe("configuration");
    expect(mis?.targetType).toBe("sheet");
  });

  it("flags team without closer as critical", () => {
    const alerts = buildStructuralBusinessAlerts({
      basePath: "",
      sheets: [
        {
          id: "s1",
          code: "X",
          label: "Fiche X",
          simulatorKey: "sim",
          workflowKey: "wk",
          presentationTemplateKey: "p",
          agreementTemplateKey: "a",
          isCommercialActive: true,
        },
      ],
      teams: [{ id: "t1", name: "Team", ceeSheetId: "s1", isActive: true }],
      members: [{ ceeSheetTeamId: "t1", roleInTeam: "agent", isActive: true }],
    });
    expect(alerts.some((a) => a.id === "struct-team-no-closer-t1")).toBe(true);
  });
});

describe("filterCockpitAlertsForVariant", () => {
  it("hides non-audience alerts for closer", () => {
    const alerts = buildStructuralBusinessAlerts({
      basePath: "",
      sheets: [
        {
          id: "s1",
          code: "X",
          label: "Fiche X",
          simulatorKey: "sim",
          workflowKey: "wk",
          presentationTemplateKey: "p",
          agreementTemplateKey: "a",
          isCommercialActive: true,
        },
      ],
      teams: [{ id: "t1", name: "Team", ceeSheetId: "s1", isActive: true }],
      members: [
        { ceeSheetTeamId: "t1", roleInTeam: "agent", isActive: true },
        { ceeSheetTeamId: "t1", roleInTeam: "closer", isActive: true },
      ],
    });
    const forCloser = filterCockpitAlertsForVariant(alerts, "closer");
    expect(forCloser.length).toBe(0);
  });

  it("scopes manager to sheet targets", () => {
    const filtered = filterCockpitAlertsForVariant(
      [
        {
          id: "a1",
          scope: "structural",
          severity: "warning",
          category: "staffing",
          title: "T",
          message: "m",
          description: "m",
          suggestedAction: "act",
          targetType: "sheet",
          targetId: "s-out",
          targetLabel: "Out",
          metricValue: null,
          thresholdValue: null,
          comparisonValue: null,
          period: null,
          roleAudience: ["manager"],
          priorityScore: 1,
          sortScore: 1,
          topWorkflows: [],
          workflowsCount: 0,
          estimatedImpactEuro: null,
          priorityLevel: "low",
          cta: { label: "L", href: "/" },
        } satisfies CockpitAlert,
      ],
      "manager",
      { userId: "u1", teamIds: new Set(["t1"]), sheetIds: new Set(["s-in"]) },
    );
    expect(filtered.length).toBe(0);
  });
});

describe("buildPeriodBusinessAlerts integration", () => {
  it("emits global backlog alert when confirm stock exceeds threshold", () => {
    const now = new Date("2026-04-11T12:00:00Z");
    const rows = Array.from({ length: 20 }, (_, i) => ({
      id: `w${i}`,
      lead_id: `l${i}`,
      cee_sheet_id: "s1",
      cee_sheet_team_id: "t1",
      workflow_status: "to_confirm",
      assigned_agent_user_id: null,
      assigned_confirmateur_user_id: null,
      assigned_closer_user_id: null,
      simulation_input_json: {},
      simulation_result_json: {},
      qualification_data_json: {},
      presentation_document_id: null,
      agreement_document_id: null,
      quote_document_id: null,
      agreement_signature_status: null,
      agreement_signature_provider: null,
      agreement_signature_request_id: null,
      agreement_sent_at: null,
      agreement_signed_at: null,
      closer_notes: null,
      is_archived: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      lead: {
        id: `l${i}`,
        company_name: "Co",
        lead_status: "open",
        cee_sheet_id: "s1",
        current_workflow_id: `w${i}`,
        contact_name: null,
        phone: null,
        email: null,
        worksite_address: null,
        worksite_city: null,
        worksite_postal_code: null,
        recording_notes: null,
        lead_channel: "web",
        lead_origin: null,
        callback_at: null,
        created_at: now.toISOString(),
      },
      cee_sheet: {
        id: "s1",
        code: "S",
        label: "Sheet",
        simulator_key: "sim",
        workflow_key: "wk",
        is_commercial_active: true,
      },
      assigned_agent: null,
      assigned_confirmateur: null,
      assigned_closer: null,
    })) as unknown as WorkflowScopedListRow[];

    const snap = minimalSnapshot({
      funnel: (() => {
        const f = emptyFunnel();
        f.total = 20;
        f.to_confirm = 20;
        return f;
      })(),
      priorityQueues: {
        staleDrafts: [],
        blockedConfirm: [],
        docsPreparedStale: [],
        agreementsAwaitingSign: [],
        oldAgreementSent: [],
      },
    });

    const alerts = buildPeriodBusinessAlerts({
      filters: {
        ceeSheetId: null,
        teamId: null,
        leadChannel: null,
        period: "days30",
      },
      periodLabel: "30 derniers jours",
      snapshot: snap,
      snapshotPrevious: snap,
      scopedPeriodRows: rows,
      scopedPreviousRows: [],
      leadsCreatedCurrent: 10,
      leadsCreatedPrevious: 10,
      basePath: "",
      now,
      userId: "u1",
    });

    expect(alerts.some((a) => a.id === "period-backlog-confirm-global")).toBe(true);
    const sorted = sortCockpitAlerts(alerts);
    expect(sorted[0].severity).toBe("critical");
    const backlog = alerts.find((a) => a.id === "period-backlog-confirm-global");
    expect(backlog?.workflowsCount).toBe(20);
    expect(backlog?.topWorkflows.length).toBeGreaterThan(0);
    expect(backlog?.topWorkflows.length).toBeLessThanOrEqual(5);
    expect(backlog?.cta.href).toContain("confirmateur");
    expect(backlog?.cta.href).toContain("tab=pending");
    expect(backlog?.estimatedImpactEuro).not.toBeNull();
  });
});
