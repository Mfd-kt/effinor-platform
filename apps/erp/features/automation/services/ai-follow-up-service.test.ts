import { describe, expect, it } from "vitest";

import { scheduleAiFollowUpIfNeeded } from "./ai-follow-up-service";

describe("scheduleAiFollowUpIfNeeded", () => {
  it("planifie si accord envoyé et délai dépassé", () => {
    const old = new Date(Date.now() - 10 * 86_400_000).toISOString();
    const r = scheduleAiFollowUpIfNeeded(
      {
        workflow_status: "agreement_sent",
        agreement_sent_at: old,
        agreement_signed_at: null,
        qualification_data_json: {},
      },
      new Date(),
    );
    expect(r.scheduled).toBe(true);
  });

  it("ne planifie pas si accord récent", () => {
    const recent = new Date(Date.now() - 86_400_000).toISOString();
    const r = scheduleAiFollowUpIfNeeded(
      {
        workflow_status: "agreement_sent",
        agreement_sent_at: recent,
        agreement_signed_at: null,
        qualification_data_json: {},
      },
      new Date(),
    );
    expect(r.scheduled).toBe(false);
  });

  it("garde-fou : pas de planif si signé", () => {
    const r = scheduleAiFollowUpIfNeeded(
      {
        workflow_status: "agreement_signed",
        agreement_sent_at: "2020-01-01T00:00:00.000Z",
        agreement_signed_at: "2020-01-02T00:00:00.000Z",
        qualification_data_json: {},
      },
      new Date(),
    );
    expect(r.scheduled).toBe(false);
  });
});
