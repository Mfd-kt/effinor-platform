import { describe, expect, it } from "vitest";

import { summarizeAdminCeeNetwork } from "@/features/cee-workflows/lib/admin-cee-network";

describe("summarizeAdminCeeNetwork", () => {
  it("aggregates sheets, teams, roles and workflow volumes", () => {
    const summary = summarizeAdminCeeNetwork({
      sheets: [
        {
          id: "sheet-1",
          code: "BAT-TH-142",
          label: "PAC",
          simulatorKey: "pac",
          workflowKey: "default",
          presentationTemplateKey: "pres",
          agreementTemplateKey: "agr",
          isCommercialActive: true,
        },
      ],
      teams: [
        {
          id: "team-1",
          ceeSheetId: "sheet-1",
          name: "Equipe PAC",
          isActive: true,
        },
      ],
      members: [
        {
          id: "member-1",
          ceeSheetTeamId: "team-1",
          userId: "u-1",
          roleInTeam: "agent",
          isActive: true,
          fullName: "Agent",
          email: "agent@test.fr",
        },
        {
          id: "member-2",
          ceeSheetTeamId: "team-1",
          userId: "u-2",
          roleInTeam: "confirmateur",
          isActive: true,
          fullName: "Confirmateur",
          email: "confirmateur@test.fr",
        },
      ],
      workflows: [
        {
          id: "wf-1",
          ceeSheetId: "sheet-1",
          ceeSheetTeamId: "team-1",
          workflowStatus: "draft",
          assignedAgentUserId: "u-1",
          assignedConfirmateurUserId: null,
          assignedCloserUserId: null,
          isArchived: false,
        },
        {
          id: "wf-2",
          ceeSheetId: "sheet-1",
          ceeSheetTeamId: "team-1",
          workflowStatus: "to_confirm",
          assignedAgentUserId: "u-1",
          assignedConfirmateurUserId: "u-2",
          assignedCloserUserId: null,
          isArchived: false,
        },
        {
          id: "wf-3",
          ceeSheetId: "sheet-1",
          ceeSheetTeamId: "team-1",
          workflowStatus: "lost",
          assignedAgentUserId: "u-1",
          assignedConfirmateurUserId: "u-2",
          assignedCloserUserId: null,
          isArchived: false,
        },
      ],
    });

    expect(summary.totals).toMatchObject({
      sheets: 1,
      activeSheets: 1,
      teams: 1,
      members: 2,
      activeWorkflows: 3,
    });

    expect(summary.bySheet[0]).toMatchObject({
      code: "BAT-TH-142",
      teamName: "Equipe PAC",
      roles: {
        agent: 1,
        confirmateur: 1,
        closer: 0,
        manager: 0,
      },
      workflowCounts: {
        total: 3,
        draft: 1,
        toConfirm: 1,
        lost: 1,
      },
    });
  });
});
