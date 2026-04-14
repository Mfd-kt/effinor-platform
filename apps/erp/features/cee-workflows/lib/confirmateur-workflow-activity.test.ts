import { describe, expect, it } from "vitest";

import { classifyConfirmateurQueue } from "@/features/cee-workflows/lib/confirmateur-workflow-activity";

describe("classifyConfirmateurQueue", () => {
  it("splits confirmateur workflows into the expected buckets", () => {
    const queue = classifyConfirmateurQueue([
      {
        workflowId: "wf-1",
        leadId: "lead-1",
        companyName: "Acme",
        civility: null,
        contactName: null,
        phone: null,
        email: null,
        sheetCode: "DESTRAT-01",
        sheetLabel: "Destrat",
        workflowStatus: "to_confirm",
        updatedAt: "2026-04-11T10:00:00.000Z",
        score: 80,
        savingEuro: 1000,
        recommendedModel: "generfeu",
        recordingNotes: null,
      },
      {
        workflowId: "wf-2",
        leadId: "lead-2",
        companyName: "Beta",
        civility: null,
        contactName: null,
        phone: null,
        email: null,
        sheetCode: "DESTRAT-01",
        sheetLabel: "Destrat",
        workflowStatus: "qualified",
        updatedAt: "2026-04-11T09:00:00.000Z",
        score: 60,
        savingEuro: 500,
        recommendedModel: "teddington_ds7",
        recordingNotes: null,
      },
      {
        workflowId: "wf-3",
        leadId: "lead-3",
        companyName: "Gamma",
        civility: null,
        contactName: null,
        phone: null,
        email: null,
        sheetCode: "DESTRAT-01",
        sheetLabel: "Destrat",
        workflowStatus: "docs_prepared",
        updatedAt: "2026-04-11T11:00:00.000Z",
        score: 90,
        savingEuro: 2000,
        recommendedModel: "generfeu",
        recordingNotes: null,
      },
    ]);

    expect(queue.pending).toHaveLength(1);
    expect(queue.qualified).toHaveLength(1);
    expect(queue.docsReady).toHaveLength(1);
    expect(queue.recent[0]?.workflowId).toBe("wf-3");
  });
});
