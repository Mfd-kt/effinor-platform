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

  const [detail, destratProducts] = await Promise.all([
    getConfirmateurWorkflowDetail(workflowId, access),
    getAgentDestratSimulatorProducts(),
  ]);

  if (!detail) {
    notFound();
  }

  const fullLead =
    detail.workflow.lead_id != null ? await getLeadById(detail.workflow.lead_id, access) : null;

  const ceeWorkflows =
    fullLead != null ? await getLeadSheetWorkflowsForLead(fullLead.id, access) : [];

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
