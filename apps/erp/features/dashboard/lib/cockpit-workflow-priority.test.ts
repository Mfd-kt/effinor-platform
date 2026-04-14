import { describe, expect, it } from "vitest";

import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

import {
  computeWorkflowPriorityScore,
  deriveCockpitAlertPriorityLevel,
  estimateImpactEuro,
  extractPotentialValueEur,
  sortWorkflowsByPriority,
} from "./cockpit-workflow-priority";

function minimalWorkflow(
  overrides: Partial<WorkflowScopedListRow> &
    Pick<WorkflowScopedListRow, "id" | "lead_id" | "workflow_status" | "updated_at">,
): WorkflowScopedListRow {
  return {
    cee_sheet_id: "s1",
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
    lead: {
      id: overrides.lead_id,
      company_name: "Acme",
      lead_status: "open",
      cee_sheet_id: "s1",
      current_workflow_id: overrides.id,
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
      created_at: "2026-04-01T08:00:00.000Z",
    },
    cee_sheet: {
      id: "s1",
      code: "S",
      label: "Fiche",
      simulator_key: "x",
      workflow_key: "y",
      is_commercial_active: true,
    },
    assigned_agent: null,
    assigned_confirmateur: null,
    assigned_closer: null,
    ...overrides,
  } as WorkflowScopedListRow;
}

describe("extractPotentialValueEur", () => {
  it("reads savingEur30Selected from simulation JSON", () => {
    const w = minimalWorkflow({
      id: "w1",
      lead_id: "l1",
      workflow_status: "agreement_sent",
      updated_at: "2026-04-10T10:00:00.000Z",
      simulation_result_json: { savingEur30Selected: 42_500 },
    });
    expect(extractPotentialValueEur(w)).toBe(42_500);
  });
});

describe("computeWorkflowPriorityScore", () => {
  it("ranks stale agreement_sent above fresh docs_prepared", () => {
    const nowMs = new Date("2026-04-11T12:00:00.000Z").getTime();
    const staleSent = minimalWorkflow({
      id: "w1",
      lead_id: "l1",
      workflow_status: "agreement_sent",
      updated_at: "2026-03-01T10:00:00.000Z",
      agreement_sent_at: "2026-03-01T10:00:00.000Z",
      simulation_result_json: { savingEur30Selected: 50_000 },
    });
    const freshDocs = minimalWorkflow({
      id: "w2",
      lead_id: "l2",
      workflow_status: "docs_prepared",
      updated_at: "2026-04-11T08:00:00.000Z",
    });
    expect(computeWorkflowPriorityScore(staleSent, { nowMs })).toBeGreaterThan(
      computeWorkflowPriorityScore(freshDocs, { nowMs }),
    );
  });
});

describe("sortWorkflowsByPriority", () => {
  it("orders descending by score", () => {
    const nowMs = new Date("2026-04-11T12:00:00.000Z").getTime();
    const a = minimalWorkflow({
      id: "a",
      lead_id: "l1",
      workflow_status: "draft",
      updated_at: "2026-04-11T08:00:00.000Z",
    });
    const b = minimalWorkflow({
      id: "b",
      lead_id: "l2",
      workflow_status: "agreement_sent",
      updated_at: "2026-03-01T10:00:00.000Z",
      agreement_sent_at: "2026-03-01T10:00:00.000Z",
    });
    const sorted = sortWorkflowsByPriority([a, b], { nowMs });
    expect(sorted[0]!.id).toBe("b");
  });
});

describe("estimateImpactEuro", () => {
  it("sums explicit potentials and defaults for missing", () => {
    const hi = minimalWorkflow({
      id: "w1",
      lead_id: "l1",
      workflow_status: "agreement_sent",
      updated_at: "2026-04-10T10:00:00.000Z",
      simulation_result_json: { savingEur30Selected: 10_000 },
    });
    const lo = minimalWorkflow({
      id: "w2",
      lead_id: "l2",
      workflow_status: "to_confirm",
      updated_at: "2026-04-10T10:00:00.000Z",
    });
    const sum = estimateImpactEuro([hi, lo]);
    expect(sum).toBeGreaterThan(10_000);
  });
});

describe("deriveCockpitAlertPriorityLevel", () => {
  it("maps critical + high impact to urgent", () => {
    expect(deriveCockpitAlertPriorityLevel("critical", 60_000, 5, 50)).toBe("urgent");
  });

  it("maps info to low", () => {
    expect(deriveCockpitAlertPriorityLevel("info", null, 0, 0)).toBe("low");
  });
});
