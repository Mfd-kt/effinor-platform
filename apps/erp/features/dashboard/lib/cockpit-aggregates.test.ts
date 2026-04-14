import { describe, expect, it } from "vitest";

import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import { getParisDayRangeIso } from "@/lib/datetime/paris-day";

import { getCockpitPeriodStartIso } from "./cockpit-period";
import {
  computeTrend,
  conversionRate,
  filterWorkflowsByCreatedPeriod,
  filterWorkflowsForCockpit,
} from "./cockpit-aggregates";

function wf(
  overrides: Partial<WorkflowScopedListRow> &
    Pick<WorkflowScopedListRow, "id" | "created_at" | "workflow_status" | "cee_sheet_id">,
): WorkflowScopedListRow {
  return {
    lead_id: "lead-1",
    cee_sheet_team_id: null,
    assigned_agent_user_id: null,
    assigned_confirmateur_user_id: null,
    assigned_closer_user_id: null,
    simulation_input_json: null,
    simulation_result_json: null,
    qualification_data_json: null,
    presentation_document_id: null,
    agreement_document_id: null,
    quote_document_id: null,
    agreement_sent_at: null,
    closer_notes: null,
    updated_at: overrides.created_at,
    ...overrides,
  } as WorkflowScopedListRow;
}

describe("getCockpitPeriodStartIso", () => {
  it("aligne « today » sur le jour civil Paris", () => {
    const now = new Date("2026-04-11T10:00:00.000Z");
    expect(getCockpitPeriodStartIso("today", now)).toBe(getParisDayRangeIso(now).startIso);
  });

  it("retourne un instant antérieur pour days30", () => {
    const now = new Date("2026-04-11T10:00:00.000Z");
    const start = getCockpitPeriodStartIso("days30", now);
    expect(new Date(start).getTime()).toBeLessThan(now.getTime());
  });
});

describe("filterWorkflowsForCockpit", () => {
  const rows: WorkflowScopedListRow[] = [
    wf({
      id: "a",
      created_at: "2026-04-01T08:00:00.000Z",
      workflow_status: "draft",
      cee_sheet_id: "s1",
      cee_sheet_team_id: "t1",
      lead: {
        id: "l1",
        company_name: "A",
        lead_status: "new",
        cee_sheet_id: "s1",
        current_workflow_id: "a",
        contact_name: "",
        phone: "",
        email: "",
        worksite_address: "",
        worksite_city: "",
        worksite_postal_code: "",
        recording_notes: "",
        lead_channel: "appel",
        lead_origin: "",
        callback_at: "",
        created_at: "2026-04-01T08:00:00.000Z",
        deleted_at: null,
      },
      cee_sheet: {
        id: "s1",
        code: "S1",
        label: "Fiche 1",
        simulator_key: "",
        workflow_key: "",
        is_commercial_active: true,
      },
    }),
    wf({
      id: "b",
      created_at: "2026-04-01T08:00:00.000Z",
      workflow_status: "draft",
      cee_sheet_id: "s2",
      cee_sheet_team_id: "t2",
      lead: {
        id: "l2",
        company_name: "B",
        lead_status: "new",
        cee_sheet_id: "s2",
        current_workflow_id: "b",
        contact_name: "",
        phone: "",
        email: "",
        worksite_address: "",
        worksite_city: "",
        worksite_postal_code: "",
        recording_notes: "",
        lead_channel: "web",
        lead_origin: "",
        callback_at: "",
        created_at: "2026-04-01T08:00:00.000Z",
        deleted_at: null,
      },
      cee_sheet: {
        id: "s2",
        code: "S2",
        label: "Fiche 2",
        simulator_key: "",
        workflow_key: "",
        is_commercial_active: true,
      },
    }),
  ];

  it("filtre par fiche, équipe et canal sans appliquer la période", () => {
    const base = {
      ceeSheetId: "s1" as const,
      teamId: "t1" as const,
      leadChannel: "appel" as const,
      period: "days30" as const,
    };
    const out = filterWorkflowsForCockpit(rows, base, { applyPeriod: false });
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe("a");
  });

  it("exclut les lignes dont le canal ne correspond pas", () => {
    const out = filterWorkflowsForCockpit(rows, {
      ceeSheetId: null,
      teamId: null,
      leadChannel: "web",
      period: "days30",
    });
    expect(out.map((r) => r.id)).toEqual(["b"]);
  });
});

describe("filterWorkflowsByCreatedPeriod", () => {
  it("ne garde que les workflows créés après le début de période", () => {
    const now = new Date("2026-04-11T12:00:00.000Z");
    const start = getCockpitPeriodStartIso("days30", now);
    const rows: WorkflowScopedListRow[] = [
      wf({
        id: "old",
        created_at: new Date(new Date(start).getTime() - 86_400_000).toISOString(),
        workflow_status: "draft",
        cee_sheet_id: "s1",
      }),
      wf({
        id: "new",
        created_at: new Date(new Date(start).getTime() + 1000).toISOString(),
        workflow_status: "draft",
        cee_sheet_id: "s1",
      }),
    ];
    const filtered = filterWorkflowsByCreatedPeriod(rows, "days30", now);
    expect(filtered.map((r) => r.id)).toEqual(["new"]);
  });
});

describe("computeTrend & conversionRate", () => {
  it("calcule un pourcentage d’évolution arrondi", () => {
    expect(computeTrend(110, 100)).toEqual({ current: 110, previous: 100, deltaPct: 10 });
  });

  it("retourne null pour conversion si dénominateur nul", () => {
    expect(conversionRate(3, 0)).toBeNull();
  });

  it("calcule un taux de conversion arrondi", () => {
    expect(conversionRate(1, 4)).toBe(25);
  });
});
