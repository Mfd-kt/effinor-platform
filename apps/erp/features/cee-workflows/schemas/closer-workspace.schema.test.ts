import { describe, expect, it } from "vitest";

import { SaveCloserNotesSchema } from "@/features/cee-workflows/schemas/closer-workspace.schema";

describe("SaveCloserNotesSchema", () => {
  it("accepts a closer notes payload", () => {
    const parsed = SaveCloserNotesSchema.safeParse({
      workflowId: "550e8400-e29b-41d4-a716-446655440000",
      closer_notes: "Client intéressé",
      objection_code: "prix",
      objection_detail: "Souhaite comparer avec un concurrent",
      last_contact_at: "2026-04-11T10:00",
      next_follow_up_at: "2026-04-12T10:00",
      call_outcome: "relance",
      loss_reason: "",
    });

    expect(parsed.success).toBe(true);
  });
});
