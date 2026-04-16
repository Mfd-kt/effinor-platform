import { describe, expect, it } from "vitest";

import { classifyCloserQueue } from "@/features/cee-workflows/lib/closer-workflow-activity";

describe("classifyCloserQueue", () => {
  it("classifies pending, signature, follow-up, signed and lost workflows", () => {
    const queue = classifyCloserQueue(
      [
        {
          workflowId: "wf-pending",
          leadId: "lead-1",
          companyName: "Acme",
          civility: null,
          contactName: null,
          phone: null,
          email: null,
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "to_close",
          updatedAt: "2026-04-11T10:00:00.000Z",
          score: 80,
          savingEuro: 1000,
          restToCharge: 200,
          recommendedModel: "generfeu",
          lastContactAt: null,
          phoneRdvAt: null,
          nextFollowUpAt: null,
          closerNotes: null,
          lossReason: null,
        },
        {
          workflowId: "wf-signature",
          leadId: "lead-2",
          companyName: "Beta",
          civility: null,
          contactName: null,
          phone: null,
          email: null,
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "agreement_sent",
          updatedAt: "2026-04-11T11:00:00.000Z",
          score: 82,
          savingEuro: 900,
          restToCharge: 100,
          recommendedModel: "generfeu",
          lastContactAt: null,
          phoneRdvAt: null,
          nextFollowUpAt: "2026-04-11T09:00:00.000Z",
          closerNotes: null,
          lossReason: null,
        },
        {
          workflowId: "wf-signed",
          leadId: "lead-3",
          companyName: "Gamma",
          civility: null,
          contactName: null,
          phone: null,
          email: null,
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "agreement_signed",
          updatedAt: "2026-04-11T12:00:00.000Z",
          score: 90,
          savingEuro: 1200,
          restToCharge: 0,
          recommendedModel: "generfeu",
          lastContactAt: null,
          phoneRdvAt: null,
          nextFollowUpAt: null,
          closerNotes: null,
          lossReason: null,
        },
        {
          workflowId: "wf-lost",
          leadId: "lead-4",
          companyName: "Delta",
          civility: null,
          contactName: null,
          phone: null,
          email: null,
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "lost",
          updatedAt: "2026-04-11T08:00:00.000Z",
          score: 10,
          savingEuro: 100,
          restToCharge: 500,
          recommendedModel: "teddington_ds3",
          lastContactAt: null,
          phoneRdvAt: null,
          nextFollowUpAt: null,
          closerNotes: null,
          lossReason: "prix",
        },
      ],
      "2026-04-11T12:30:00.000Z",
    );

    expect(queue.pending).toHaveLength(1);
    expect(queue.waitingSignature).toHaveLength(1);
    expect(queue.followUps).toHaveLength(1);
    expect(queue.signed).toHaveLength(1);
    expect(queue.lost).toHaveLength(1);
  });

  it("treats an overdue RDV téléphone (callback_at) as relance when next_follow_up is empty", () => {
    const queue = classifyCloserQueue(
      [
        {
          workflowId: "wf-cb",
          leadId: "lead-cb",
          companyName: "Callback Co",
          civility: null,
          contactName: null,
          phone: null,
          email: null,
          sheetCode: "DESTRAT-01",
          sheetLabel: "Destrat",
          workflowStatus: "to_close",
          updatedAt: "2026-04-11T10:00:00.000Z",
          score: 80,
          savingEuro: 1000,
          restToCharge: 200,
          recommendedModel: "generfeu",
          lastContactAt: null,
          phoneRdvAt: "2026-04-11T08:00:00.000Z",
          nextFollowUpAt: null,
          closerNotes: null,
          lossReason: null,
        },
      ],
      "2026-04-11T12:30:00.000Z",
    );

    expect(queue.followUps).toHaveLength(1);
    expect(queue.followUps[0]?.workflowId).toBe("wf-cb");
  });
});
