import { describe, expect, it } from "vitest";

import { buildWorkflowEventInsert } from "@/features/cee-workflows/domain/events";

describe("buildWorkflowEventInsert", () => {
  it("builds a normalized workflow event payload", () => {
    expect(
      buildWorkflowEventInsert({
        workflowId: "wf-1",
        eventType: "agreement_sent",
        eventLabel: "Accord commercial envoyé",
        payloadJson: { signatureProvider: "email" },
        createdByUserId: "user-1",
      }),
    ).toEqual({
      lead_sheet_workflow_id: "wf-1",
      event_type: "agreement_sent",
      event_label: "Accord commercial envoyé",
      payload_json: { signatureProvider: "email" },
      created_by_user_id: "user-1",
    });
  });
});
