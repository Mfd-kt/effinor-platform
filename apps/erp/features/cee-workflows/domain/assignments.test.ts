import { describe, expect, it } from "vitest";

import { prefillWorkflowAssignmentsFromMembers } from "@/features/cee-workflows/domain/assignments";

describe("prefillWorkflowAssignmentsFromMembers", () => {
  it("returns the first active user for each commercial role", () => {
    expect(
      prefillWorkflowAssignmentsFromMembers([
        { userId: "u-1", roleInTeam: "agent", isActive: true },
        { userId: "u-2", roleInTeam: "confirmateur", isActive: true },
        { userId: "u-3", roleInTeam: "closer", isActive: true },
        { userId: "u-4", roleInTeam: "agent", isActive: true },
      ]),
    ).toEqual({
      assignedAgentUserId: "u-1",
      assignedConfirmateurUserId: "u-2",
      assignedCloserUserId: "u-3",
    });
  });

  it("returns null assignments when the sheet has no active team configured", () => {
    expect(prefillWorkflowAssignmentsFromMembers([])).toEqual({
      assignedAgentUserId: null,
      assignedConfirmateurUserId: null,
      assignedCloserUserId: null,
    });
  });

  it("ignores inactive team members", () => {
    expect(
      prefillWorkflowAssignmentsFromMembers([
        { userId: "u-1", roleInTeam: "agent", isActive: false },
        { userId: "u-2", roleInTeam: "agent", isActive: true },
      ]),
    ).toEqual({
      assignedAgentUserId: "u-2",
      assignedConfirmateurUserId: null,
      assignedCloserUserId: null,
    });
  });
});
