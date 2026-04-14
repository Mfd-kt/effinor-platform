import { describe, expect, it } from "vitest";

import { AgentWorkflowPayloadSchema } from "@/features/cee-workflows/schemas/agent-workspace.schema";

describe("AgentWorkflowPayloadSchema", () => {
  it("accepts a minimal valid agent payload", () => {
    const parsed = AgentWorkflowPayloadSchema.safeParse({
      ceeSheetId: "550e8400-e29b-41d4-a716-446655440000",
      prospect: {
        companyName: "Acme",
        contactName: "Jean Martin",
        phone: "0612345678",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const parsed = AgentWorkflowPayloadSchema.safeParse({
      ceeSheetId: "550e8400-e29b-41d4-a716-446655440000",
      prospect: {
        companyName: "Acme",
        contactName: "Jean Martin",
        phone: "0612345678",
        email: "bad-email",
      },
    });

    expect(parsed.success).toBe(false);
  });
});
