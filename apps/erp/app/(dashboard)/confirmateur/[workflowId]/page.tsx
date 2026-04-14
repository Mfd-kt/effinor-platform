import { notFound } from "next/navigation";

import { ConfirmateurWorkflowFocusPanel } from "@/features/cee-workflows/components/confirmateur-workflow-focus-panel";
import { getAgentDestratSimulatorProducts } from "@/features/cee-workflows/queries/get-agent-simulator-products";
import { getConfirmateurWorkflowDetail } from "@/features/cee-workflows/queries/get-confirmateur-workflow-detail";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { canAccessConfirmateurWorkspace } from "@/lib/auth/module-access";
import { getAccessContext } from "@/lib/auth/access-context";

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

  return (
    <ConfirmateurWorkflowFocusPanel
      detail={detail}
      fullLead={fullLead}
      destratProducts={destratProducts}
      sheetFilterId={sp.sheet ?? null}
    />
  );
}
