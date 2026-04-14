export type AdminCeeNetworkSheet = {
  id: string;
  code: string;
  label: string;
  simulatorKey: string | null;
  workflowKey: string | null;
  presentationTemplateKey: string | null;
  agreementTemplateKey: string | null;
  isCommercialActive: boolean;
};

export type AdminCeeNetworkTeam = {
  id: string;
  ceeSheetId: string;
  name: string;
  isActive: boolean;
};

export type AdminCeeNetworkMember = {
  id: string;
  ceeSheetTeamId: string;
  userId: string;
  roleInTeam: string;
  isActive: boolean;
  fullName: string | null;
  email: string;
};

export type AdminCeeNetworkWorkflow = {
  id: string;
  ceeSheetId: string;
  ceeSheetTeamId: string | null;
  workflowStatus: string;
  assignedAgentUserId: string | null;
  assignedConfirmateurUserId: string | null;
  assignedCloserUserId: string | null;
  isArchived: boolean;
};

export type AdminCeeNetworkSummary = {
  totals: {
    sheets: number;
    activeSheets: number;
    teams: number;
    members: number;
    activeWorkflows: number;
  };
  bySheet: Array<{
    sheetId: string;
    code: string;
    label: string;
    simulatorKey: string | null;
    isCommercialActive: boolean;
    teamName: string | null;
    memberCount: number;
    roles: {
      agent: number;
      confirmateur: number;
      closer: number;
      manager: number;
    };
    workflowCounts: {
      total: number;
      draft: number;
      toConfirm: number;
      qualified: number;
      toClose: number;
      agreementSent: number;
      signed: number;
      lost: number;
    };
  }>;
};

export function summarizeAdminCeeNetwork(input: {
  sheets: AdminCeeNetworkSheet[];
  teams: AdminCeeNetworkTeam[];
  members: AdminCeeNetworkMember[];
  workflows: AdminCeeNetworkWorkflow[];
}): AdminCeeNetworkSummary {
  const activeTeams = input.teams.filter((team) => team.isActive);
  const activeMembers = input.members.filter((member) => member.isActive);
  const activeWorkflows = input.workflows.filter((workflow) => !workflow.isArchived);

  return {
    totals: {
      sheets: input.sheets.length,
      activeSheets: input.sheets.filter((sheet) => sheet.isCommercialActive).length,
      teams: activeTeams.length,
      members: activeMembers.length,
      activeWorkflows: activeWorkflows.length,
    },
    bySheet: input.sheets.map((sheet) => {
      const team = activeTeams.find((entry) => entry.ceeSheetId === sheet.id) ?? null;
      const members = team ? activeMembers.filter((member) => member.ceeSheetTeamId === team.id) : [];
      const workflows = activeWorkflows.filter((workflow) => workflow.ceeSheetId === sheet.id);

      return {
        sheetId: sheet.id,
        code: sheet.code,
        label: sheet.label,
        simulatorKey: sheet.simulatorKey,
        isCommercialActive: sheet.isCommercialActive,
        teamName: team?.name ?? null,
        memberCount: members.length,
        roles: {
          agent: members.filter((member) => member.roleInTeam === "agent").length,
          confirmateur: members.filter((member) => member.roleInTeam === "confirmateur").length,
          closer: members.filter((member) => member.roleInTeam === "closer").length,
          manager: members.filter((member) => member.roleInTeam === "manager").length,
        },
        workflowCounts: {
          total: workflows.length,
          draft: workflows.filter((workflow) => workflow.workflowStatus === "draft").length,
          toConfirm: workflows.filter((workflow) =>
            ["simulation_done", "to_confirm"].includes(workflow.workflowStatus),
          ).length,
          qualified: workflows.filter((workflow) => workflow.workflowStatus === "qualified").length,
          toClose: workflows.filter((workflow) =>
            ["docs_prepared", "to_close"].includes(workflow.workflowStatus),
          ).length,
          agreementSent: workflows.filter((workflow) => workflow.workflowStatus === "agreement_sent").length,
          signed: workflows.filter((workflow) =>
            ["agreement_signed", "paid", "quote_signed"].includes(workflow.workflowStatus),
          ).length,
          lost: workflows.filter((workflow) => workflow.workflowStatus === "lost").length,
        },
      };
    }),
  };
}
