import { notFound } from "next/navigation";

import { ConfirmateurWorkflowFocusPanel } from "@/features/cee-workflows/components/confirmateur-workflow-focus-panel";
import { getAgentDestratSimulatorProducts } from "@/features/cee-workflows/queries/get-agent-simulator-products";
import { getConfirmateurWorkflowDetail } from "@/features/cee-workflows/queries/get-confirmateur-workflow-detail";
import { getLeadSheetWorkflowsForLead } from "@/features/cee-workflows/queries/get-lead-sheet-workflows";
import { LeadCrmRightRail } from "@/features/leads/components/lead-crm-right-rail";
import { LeadRealtimeListener } from "@/features/leads/components/lead-realtime-listener";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { canAccessConfirmateurWorkspace } from "@/lib/auth/module-access";
import { getAccessContext } from "@/lib/auth/access-context";
import { getActiveTechnicalVisitIdForWorkflow } from "@/features/technical-visits/queries/get-active-technical-visit-for-workflow";
import { resolveVisitTemplateForCeeSheetAsync } from "@/features/technical-visits/workflow/cee-sheet-to-visit-template";
import { createClient } from "@/lib/supabase/server";
import {
  canAdvanceWorkflowToTechnicalVisitPending,
  parseWorkflowStatusForTransitions,
} from "@/features/technical-visits/workflow/workflow-technical-visit-eligibility";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ workflowId: string }>;
  searchParams?: Promise<{ sheet?: string }>;
};

export default async function ConfirmateurWorkflowPage({ params, searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessConfirmateurWorkspace(access)) {
    notFound();
  }

  const { workflowId } = await params;
  const sp = (await searchParams) ?? {};

  const [detail, destratProducts, activeTechnicalVisitId, supabase] = await Promise.all([
    getConfirmateurWorkflowDetail(workflowId, access),
    getAgentDestratSimulatorProducts(),
    getActiveTechnicalVisitIdForWorkflow(workflowId),
    createClient(),
  ]);

  if (!detail) {
    notFound();
  }

  const fullLead =
    detail.workflow.lead_id != null ? await getLeadById(detail.workflow.lead_id, access) : null;

  const ceeWorkflows =
    fullLead != null ? await getLeadSheetWorkflowsForLead(fullLead.id, access) : [];

  const visitTemplateAvailable =
    (await resolveVisitTemplateForCeeSheetAsync(supabase, detail.workflow.cee_sheet)) !== null;
  const wfStatusParsed = parseWorkflowStatusForTransitions(detail.workflow.workflow_status);
  const workflowStatusAllowsTechnicalVisit =
    wfStatusParsed != null && canAdvanceWorkflowToTechnicalVisitPending(wfStatusParsed);

  return (
    <div>
      {fullLead ? <LeadRealtimeListener leadId={fullLead.id} /> : null}
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "min-w-0 space-y-6",
            fullLead &&
              "lg:pr-[calc(28rem+2rem)] xl:pr-[calc(31rem+2.25rem)] 2xl:pr-[calc(34rem+2.5rem)]",
          )}
        >
          <ConfirmateurWorkflowFocusPanel
            detail={detail}
            fullLead={fullLead}
            destratProducts={destratProducts}
            sheetFilterId={sp.sheet ?? null}
            activeTechnicalVisitId={activeTechnicalVisitId}
            visitTemplateAvailable={visitTemplateAvailable}
            workflowStatusAllowsTechnicalVisit={workflowStatusAllowsTechnicalVisit}
          />
        </div>
        {fullLead ? (
          <LeadCrmRightRail
            lead={fullLead}
            workflows={ceeWorkflows.map((w) => ({ id: w.id, cee_sheet: w.cee_sheet }))}
          />
        ) : null}
      </div>
    </div>
  );
}
