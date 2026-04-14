"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { assignWorkflowUsers } from "@/features/cee-workflows/actions/workflow-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

export type WorkflowAssignmentProfileOption = { id: string; label: string };

type Props = {
  workflowId: string;
  initialAgentId: string;
  initialConfirmateurId: string;
  initialCloserId: string;
  profileOptions: WorkflowAssignmentProfileOption[];
};

export function LeadWorkflowAssignmentsEditor({
  workflowId,
  initialAgentId,
  initialConfirmateurId,
  initialCloserId,
  profileOptions,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [agentId, setAgentId] = useState(initialAgentId);
  const [confId, setConfId] = useState(initialConfirmateurId);
  const [closerId, setCloserId] = useState(initialCloserId);

  const dirty =
    agentId !== initialAgentId || confId !== initialConfirmateurId || closerId !== initialCloserId;

  function save() {
    startTransition(async () => {
      const res = await assignWorkflowUsers({
        workflowId,
        assignedAgentUserId: agentId ? agentId : "",
        assignedConfirmateurUserId: confId ? confId : "",
        assignedCloserUserId: closerId ? closerId : "",
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Affectations enregistrées.");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        Affectations du dossier (super administrateur) — à ajuster si l&apos;IA ou la création automatique ne
        correspondent pas à la réalité.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`wf-${workflowId}-agent`}>Agent</Label>
          <select
            id={`wf-${workflowId}-agent`}
            className={selectClassName}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          >
            <option value="">— Non affecté —</option>
            {profileOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`wf-${workflowId}-conf`}>Confirmateur</Label>
          <select
            id={`wf-${workflowId}-conf`}
            className={selectClassName}
            value={confId}
            onChange={(e) => setConfId(e.target.value)}
          >
            <option value="">— Non affecté —</option>
            {profileOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`wf-${workflowId}-closer`}>Closer</Label>
          <select
            id={`wf-${workflowId}-closer`}
            className={selectClassName}
            value={closerId}
            onChange={(e) => setCloserId(e.target.value)}
          >
            <option value="">— Non affecté —</option>
            {profileOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="button" size="sm" disabled={!dirty || pending} onClick={save}>
        {pending ? "Enregistrement…" : "Enregistrer les affectations"}
      </Button>
    </div>
  );
}
