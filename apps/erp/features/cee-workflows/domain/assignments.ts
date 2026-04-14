import type { CeeTeamRole } from "./constants";

export type TeamMemberAssignment = {
  userId: string;
  roleInTeam: CeeTeamRole;
  isActive: boolean;
};

export type PrefilledWorkflowAssignments = {
  assignedAgentUserId: string | null;
  assignedConfirmateurUserId: string | null;
  assignedCloserUserId: string | null;
};

function firstActiveUserIdByRole(
  members: TeamMemberAssignment[],
  role: CeeTeamRole,
): string | null {
  return members.find((member) => member.isActive && member.roleInTeam === role)?.userId ?? null;
}

export function prefillWorkflowAssignmentsFromMembers(
  members: TeamMemberAssignment[],
): PrefilledWorkflowAssignments {
  return {
    assignedAgentUserId: firstActiveUserIdByRole(members, "agent"),
    assignedConfirmateurUserId: firstActiveUserIdByRole(members, "confirmateur"),
    assignedCloserUserId: firstActiveUserIdByRole(members, "closer"),
  };
}
