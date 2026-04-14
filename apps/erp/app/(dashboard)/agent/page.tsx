import { notFound } from "next/navigation";

import { AgentWorkstation } from "@/features/cee-workflows/components/agent-workstation";
import { resolvePreferredCeeSheetIdForLead } from "@/features/cee-workflows/lib/resolve-preferred-cee-sheet-for-lead";
import {
  computeCallbackPerformanceStats,
  computeCommercialCallbackKpis,
  fetchCommercialCallbacksForAgentWorkstation,
} from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";
import { getAgentDashboardData } from "@/features/cee-workflows/queries/get-agent-dashboard-data";
import { getAgentDestratSimulatorProducts } from "@/features/cee-workflows/queries/get-agent-simulator-products";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessCeeWorkflowsModule } from "@/lib/auth/module-access";

type PageProps = {
  searchParams?: Promise<{ lead?: string }>;
};

export default async function AgentPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessCeeWorkflowsModule(access)) {
    notFound();
  }

  const sp = searchParams ? await searchParams : undefined;
  const leadId = typeof sp?.lead === "string" && sp.lead.trim() ? sp.lead.trim() : undefined;

  const [dashboard, destratProducts, commercialCallbacks, leadForSheet] = await Promise.all([
    getAgentDashboardData(access, undefined, { restrictToLeadsCreatedByCurrentUser: true }),
    getAgentDestratSimulatorProducts(),
    fetchCommercialCallbacksForAgentWorkstation(access),
    leadId ? getLeadById(leadId, access) : Promise.resolve(null),
  ]);

  const initialSheetId =
    leadForSheet != null
      ? resolvePreferredCeeSheetIdForLead(dashboard.sheets, {
          cee_sheet_id: leadForSheet.cee_sheet_id,
          product_interest: leadForSheet.product_interest,
        })
      : null;

  const callbackKpis = computeCommercialCallbackKpis(commercialCallbacks);
  const callbackPerformance = computeCallbackPerformanceStats(commercialCallbacks);

  return (
    <AgentWorkstation
      sheets={dashboard.sheets}
      activity={dashboard.activity}
      destratProducts={destratProducts}
      commercialCallbacks={commercialCallbacks}
      callbackKpis={callbackKpis}
      callbackPerformance={callbackPerformance}
      initialSheetId={initialSheetId}
    />
  );
}
