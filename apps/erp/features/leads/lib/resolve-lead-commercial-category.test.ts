import { describe, expect, it } from "vitest";

import {
  commercialCategoryFromCeeSheet,
  leadListFicheCeeCategoryLabel,
  pickPrimaryWorkflowForLead,
  resolveLeadCommercialCategoryForUi,
  simulationCategoryForLeadWorkflow,
  simulationRecommendedCategoryLabel,
} from "./resolve-lead-commercial-category";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

const ceeSheetEmbedDefaults: Pick<
  NonNullable<WorkflowScopedListRow["cee_sheet"]>,
  "requires_technical_visit" | "technical_visit_template_key" | "technical_visit_template_version"
> = {
  requires_technical_visit: false,
  technical_visit_template_key: null,
  technical_visit_template_version: null,
};

type WfStubCeeSheet = {
  id: string;
  code: string;
  label: string;
  simulator_key: string;
  workflow_key: string;
  is_commercial_active: boolean;
  requires_technical_visit?: boolean;
  technical_visit_template_key?: string | null;
  technical_visit_template_version?: number | null;
};

function wfStub(
  partial: Omit<Partial<WorkflowScopedListRow>, "cee_sheet"> & { cee_sheet: WfStubCeeSheet },
): WorkflowScopedListRow {
  return {
    id: partial.id ?? "w1",
    lead_id: partial.lead_id ?? "l1",
    cee_sheet_id: partial.cee_sheet_id ?? "s1",
    cee_sheet_team_id: null,
    workflow_status: partial.workflow_status ?? "draft",
    assigned_agent_user_id: null,
    assigned_confirmateur_user_id: null,
    assigned_closer_user_id: null,
    simulation_input_json: partial.simulation_input_json ?? {},
    simulation_result_json: partial.simulation_result_json ?? {},
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
    is_archived: partial.is_archived ?? false,
    created_at: partial.created_at ?? new Date().toISOString(),
    updated_at: partial.updated_at ?? new Date().toISOString(),
    lead: null,
    cee_sheet: { ...ceeSheetEmbedDefaults, ...partial.cee_sheet } as NonNullable<
      WorkflowScopedListRow["cee_sheet"]
    >,
    assigned_agent: null,
    assigned_confirmateur: null,
    assigned_closer: null,
  };
}

describe("commercialCategoryFromCeeSheet", () => {
  it("maps destrat simulator_key", () => {
    expect(
      commercialCategoryFromCeeSheet({
        simulator_key: "destrat",
        workflow_key: "x",
        label: "X",
        code: "Y",
      }),
    ).toBe("Destratificateur");
  });

  it("maps pac simulator_key", () => {
    expect(
      commercialCategoryFromCeeSheet({
        simulator_key: "pac",
        workflow_key: "x",
        label: "X",
        code: "Y",
      }),
    ).toBe("PAC");
  });
});

describe("simulationRecommendedCategoryLabel", () => {
  it("reads PAC from snapshot { result }", () => {
    expect(
      simulationRecommendedCategoryLabel({
        result: {
          ceeSolution: { solution: "PAC", eligible: true, reason: "", commercialMessage: "" },
        },
      }),
    ).toBe("PAC");
  });

  it("reads DESTRAT from flat result", () => {
    expect(
      simulationRecommendedCategoryLabel({
        ceeSolution: { solution: "DESTRAT", eligible: true, reason: "", commercialMessage: "", destratCeeSheetCode: "BAT-TH-142" },
      }),
    ).toBe("Destratificateur");
  });
});

describe("simulationCategoryForLeadWorkflow", () => {
  it("prefers workflow simulation_result_json over lead payload", () => {
    const w = wfStub({
      simulation_result_json: {
        result: { ceeSolution: { solution: "DESTRAT", eligible: true, reason: "", commercialMessage: "" } },
      },
      cee_sheet: {
        id: "cs1",
        code: "D",
        label: "D",
        simulator_key: "destrat",
        workflow_key: "w",
        is_commercial_active: true,
      },
    });
    const leadPayload = {
      result: { ceeSolution: { solution: "PAC", eligible: true, reason: "", commercialMessage: "" } },
    };
    expect(simulationCategoryForLeadWorkflow(w, leadPayload)).toBe("Destratificateur");
  });

  it("falls back to lead payload when workflow result has no ceeSolution", () => {
    const w = wfStub({
      simulation_result_json: {},
      cee_sheet: {
        id: "cs1",
        code: "D",
        label: "Destratificateur d'air",
        simulator_key: "destrat",
        workflow_key: "w",
        is_commercial_active: true,
      },
    });
    const leadPayload = {
      result: { ceeSolution: { solution: "PAC", eligible: true, reason: "", commercialMessage: "" } },
    };
    expect(simulationCategoryForLeadWorkflow(w, leadPayload)).toBe("PAC");
  });
});

describe("leadListFicheCeeCategoryLabel", () => {
  it("prioritizes simulation PAC over destrat cee_sheet join", () => {
    expect(
      leadListFicheCeeCategoryLabel({
        sim_payload_json: {
          result: { ceeSolution: { solution: "PAC", eligible: true, reason: "", commercialMessage: "" } },
        },
        cee_sheet: {
          code: "X",
          label: "Destratificateur d'air",
          simulator_key: "destrat",
          workflow_key: "w",
        },
      }),
    ).toBe("PAC");
  });
});

describe("resolveLeadCommercialCategoryForUi", () => {
  it("prefers lead sim_payload PAC over workflow destrat sheet", () => {
    const w = wfStub({
      id: "wf-destrat",
      cee_sheet: {
        id: "cs1",
        code: "DESTRAT",
        label: "Destratificateur d'air",
        simulator_key: "destrat",
        workflow_key: "destrat_v1",
        is_commercial_active: true,
      },
    });
    const label = resolveLeadCommercialCategoryForUi(
      {
        current_workflow_id: "wf-destrat",
        sim_payload_json: {
          result: { ceeSolution: { solution: "PAC", eligible: true, reason: "", commercialMessage: "" } },
        },
      },
      [w],
      null,
    );
    expect(label).toBe("PAC");
  });

  it("uses workflow fiche CEE even when lead root fiche would imply another line", () => {
    const w = wfStub({
      id: "wf-destrat",
      cee_sheet: {
        id: "cs1",
        code: "DESTRAT",
        label: "Destratificateur d'air",
        simulator_key: "destrat",
        workflow_key: "destrat_v1",
        is_commercial_active: true,
      },
    });
    const pacRoot = {
      code: "PAC",
      label: "Pompe à chaleur",
      simulator_key: "pac",
      workflow_key: "pac_v1",
    };
    const label = resolveLeadCommercialCategoryForUi({ current_workflow_id: "wf-destrat" }, [w], pacRoot);
    expect(label).toBe("Destratificateur");
  });

  it("uses lead root fiche CEE when there is no workflow", () => {
    expect(
      resolveLeadCommercialCategoryForUi({ current_workflow_id: null }, [], {
        code: "PAC",
        label: "PAC",
        simulator_key: "pac",
        workflow_key: "x",
      }),
    ).toBe("PAC");
  });

  it("uses workflow sheet when set", () => {
    const w = wfStub({
      id: "wf-destrat",
      cee_sheet: {
        id: "cs1",
        code: "DESTRAT",
        label: "Destratificateur d'air",
        simulator_key: "destrat",
        workflow_key: "destrat_v1",
        is_commercial_active: true,
      },
    });
    expect(resolveLeadCommercialCategoryForUi({ current_workflow_id: "wf-destrat" }, [w], null)).toBe(
      "Destratificateur",
    );
  });
});

describe("pickPrimaryWorkflowForLead", () => {
  it("uses current_workflow_id when set", () => {
    const a = wfStub({ id: "a", cee_sheet: { id: "1", code: "A", label: "A", simulator_key: "destrat", workflow_key: "", is_commercial_active: true } });
    const b = wfStub({ id: "b", cee_sheet: { id: "2", code: "B", label: "B", simulator_key: "pac", workflow_key: "", is_commercial_active: true } });
    const picked = pickPrimaryWorkflowForLead({ current_workflow_id: "b" }, [a, b]);
    expect(picked?.id).toBe("b");
  });
});
