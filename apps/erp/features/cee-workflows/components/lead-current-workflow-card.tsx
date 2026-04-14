import { Badge } from "@/components/ui/badge";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

function profileLabel(profile: { full_name: string | null; email: string } | null): string {
  return profile?.full_name?.trim() || profile?.email || "Non affecté";
}

export function LeadCurrentWorkflowCard({
  workflows,
}: {
  workflows: WorkflowScopedListRow[];
}) {
  if (workflows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
        Aucun workflow fiche CEE n&apos;est encore rattaché à ce lead.
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
          </div>
        </div>
      ))}
    </div>
  );
}
