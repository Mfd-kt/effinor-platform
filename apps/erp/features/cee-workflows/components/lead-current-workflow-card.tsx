import { Badge } from "@/components/ui/badge";
import {
  LeadSwitchCeeSheetPanel,
  type CeeSheetSwitchOption,
} from "@/features/cee-workflows/components/lead-switch-cee-sheet-panel";
import {
  LeadWorkflowAssignmentsEditor,
  type WorkflowAssignmentProfileOption,
} from "@/features/cee-workflows/components/lead-workflow-assignments-editor";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

type WorkflowTeamMember = NonNullable<
  NonNullable<WorkflowScopedListRow["cee_sheet_team"]>["cee_sheet_team_members"]
>[number];

function profileLabel(profile: { full_name: string | null; email: string } | null): string {
  return profile?.full_name?.trim() || profile?.email || "Non affecté";
}

function workflowTeamManagerLabel(w: WorkflowScopedListRow): string | null {
  const members: WorkflowTeamMember[] = w.cee_sheet_team?.cee_sheet_team_members ?? [];
  const m = members.find((x) => x.role_in_team === "manager" && x.is_active);
  const p = m?.profile;
  if (!p) return null;
  return p.full_name?.trim() || p.email || null;
}

export function LeadCurrentWorkflowCard({
  workflows,
  profileOptions = [],
  readOnly = false,
  canEditAssignments = false,
  leadId,
  currentCeeSheetId = null,
  canSwitchCeeSheet = false,
  ceeSheetSwitchOptions = [],
}: {
  workflows: WorkflowScopedListRow[];
  profileOptions?: WorkflowAssignmentProfileOption[];
  readOnly?: boolean;
  /** Super administrateur : listes Agent / Confirmateur / Closer modifiables. */
  canEditAssignments?: boolean;
  /** Super administrateur : bascule vers une autre fiche CEE (nouveau workflow). */
  leadId?: string;
  currentCeeSheetId?: string | null;
  canSwitchCeeSheet?: boolean;
  ceeSheetSwitchOptions?: CeeSheetSwitchOption[];
}) {
  const switchPanel =
    canSwitchCeeSheet && leadId && !readOnly && ceeSheetSwitchOptions.length > 0 ? (
      <LeadSwitchCeeSheetPanel
        leadId={leadId}
        currentCeeSheetId={currentCeeSheetId}
        sheetOptions={ceeSheetSwitchOptions}
        readOnly={readOnly}
      />
    ) : null;

  if (workflows.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          Aucun workflow fiche CEE n&apos;est encore rattaché à ce lead.
        </div>
        {switchPanel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map((workflow) => (
        <div key={workflow.id} className="rounded-xl border border-border bg-card px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-foreground">
              {workflow.cee_sheet?.label ?? "Fiche inconnue"}
            </div>
            {workflow.cee_sheet?.code ? (
              <Badge variant="secondary">{workflow.cee_sheet.code}</Badge>
            ) : null}
            <Badge variant="outline">{workflow.workflow_status}</Badge>
            {workflow.is_archived ? <Badge variant="secondary">Archive</Badge> : null}
          </div>

          <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground/70">Agent</div>
              <div className="font-medium text-foreground">{profileLabel(workflow.assigned_agent)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground/70">Confirmateur</div>
              <div className="font-medium text-foreground">
                {profileLabel(workflow.assigned_confirmateur)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground/70">Closer</div>
              <div className="font-medium text-foreground">{profileLabel(workflow.assigned_closer)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground/70">Manager (équipe fiche)</div>
              <div className="font-medium text-foreground">
                {workflowTeamManagerLabel(workflow) ?? (
                  <span className="font-normal text-muted-foreground">Non renseigné sur l&apos;équipe</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Rôle « manager » dans l&apos;équipe CEE rattachée au workflow — modifiable dans Réglages → fiches CEE →
                équipes.
              </p>
            </div>
          </div>

          {canEditAssignments && !readOnly && profileOptions.length > 0 ? (
            <LeadWorkflowAssignmentsEditor
              key={`${workflow.id}-${workflow.assigned_agent_user_id ?? ""}-${workflow.assigned_confirmateur_user_id ?? ""}-${workflow.assigned_closer_user_id ?? ""}`}
              workflowId={workflow.id}
              initialAgentId={workflow.assigned_agent_user_id ?? ""}
              initialConfirmateurId={workflow.assigned_confirmateur_user_id ?? ""}
              initialCloserId={workflow.assigned_closer_user_id ?? ""}
              profileOptions={profileOptions}
            />
          ) : null}
        </div>
      ))}

      {switchPanel}
    </div>
  );
}
