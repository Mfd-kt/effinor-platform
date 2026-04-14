import { describe, expect, it } from "vitest";

import {
  commercialCategoryFromCeeSheet,
  pickPrimaryWorkflowForLead,
  resolveLeadCommercialCategoryForUi,
} from "./resolve-lead-commercial-category";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

function wfStub(
  partial: Partial<WorkflowScopedListRow> & {
    cee_sheet: NonNullable<WorkflowScopedListRow["cee_sheet"]>;
  },
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
    is_archived: partial.is_archived ?? false,
    created_at: partial.created_at ?? new Date().toISOString(),
    updated_at: partial.updated_at ?? new Date().toISOString(),
    lead: null,
    cee_sheet: partial.cee_sheet,
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

describe("resolveLeadCommercialCategoryForUi", () => {
  it("prefers lead product_interest (e.g. PAC) when workflow sheet is a different fiche", () => {
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
      { product_interest: "PAC", current_workflow_id: "wf-destrat" },
      [w],
    );
    expect(label).toBe("PAC");
  });

  it("falls back to product_interest when no workflow", () => {
    expect(
      resolveLeadCommercialCategoryForUi({ product_interest: "PAC", current_workflow_id: null }, []),
    ).toBe("PAC");
  });

  it("uses workflow sheet when lead category is empty", () => {
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
    expect(
      resolveLeadCommercialCategoryForUi({ product_interest: "", current_workflow_id: "wf-destrat" }, [w]),
    ).toBe("Destratificateur");
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
