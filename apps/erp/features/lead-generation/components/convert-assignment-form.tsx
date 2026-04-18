"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { convertLeadGenerationAssignmentToLeadAction } from "@/features/lead-generation/actions/convert-lead-generation-assignment-to-lead-action";
import type { LeadGenerationAssignableAgent } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents";
import { cn } from "@/lib/utils";

import { LeadAssignableAgentSelect } from "./lead-generation-assignable-agent-select";

type Props = {
  assignmentId: string;
  defaultAgentId: string;
  agents: LeadGenerationAssignableAgent[];
};

export function ConvertAssignmentForm({ assignmentId, defaultAgentId, agents }: Props) {
  const [agentId, setAgentId] = useState(defaultAgentId);
  const [message, setMessage] = useState<string | null>(null);
  const [successLeadId, setSuccessLeadId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAgentId(defaultAgentId);
  }, [defaultAgentId]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSuccessLeadId(null);
    if (!agentId.trim()) {
      setMessage("Choisissez le collaborateur concerné par la conversion.");
      return;
    }
    startTransition(async () => {
      const res = await convertLeadGenerationAssignmentToLeadAction({
        assignmentId,
        agentId: agentId.trim(),
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const r = res.data;
      if (r.status === "success") {
        setSuccessLeadId(r.leadId);
        setMessage("La fiche prospect a été créée.");
        return;
      }
      setMessage(`Action refusée : ${r.status}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">Convertir en fiche prospect</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Crée une fiche dans le CRM à partir de cette attribution. Le collaborateur doit être celui qui porte
          la prospection sur cette fiche.
        </p>
      </div>
      <input type="hidden" name="assignmentId" value={assignmentId} readOnly aria-hidden />
      <div className="space-y-2">
        <label htmlFor="conv-agent" className="text-sm font-medium leading-none">
          Collaborateur
        </label>
        <LeadAssignableAgentSelect
          id="conv-agent"
          agents={agents}
          value={agentId}
          onValueChange={setAgentId}
        />
      </div>
      <Button type="submit" disabled={pending || !agentId.trim()}>
        Convertir en fiche prospect
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {successLeadId ? (
        <p className="text-sm">
          <Link
            href={`/leads/${successLeadId}`}
            className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto p-0 font-medium")}
          >
            Ouvrir la fiche prospect
          </Link>
        </p>
      ) : null}
    </form>
  );
}
