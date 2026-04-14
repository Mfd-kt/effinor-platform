import { notFound } from "next/navigation";

import { AgentWorkstation } from "@/features/cee-workflows/components/agent-workstation";
import {
  computeCallbackPerformanceStats,
  computeCommercialCallbackKpis,
  fetchCommercialCallbacksForAgentWorkstation,
} from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";
import { getAgentDashboardData } from "@/features/cee-workflows/queries/get-agent-dashboard-data";
import { getAgentDestratSimulatorProducts } from "@/features/cee-workflows/queries/get-agent-simulator-products";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessCeeWorkflowsModule } from "@/lib/auth/module-access";

export default async function AgentPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessCeeWorkflowsModule(access)) {
    notFound();
  }

  const [dashboard, destratProducts, commercialCallbacks] = await Promise.all([
    getAgentDashboardData(access, undefined, { restrictToLeadsCreatedByCurrentUser: true }),
    getAgentDestratSimulatorProducts(),
    fetchCommercialCallbacksForAgentWorkstation(access),
  ]);

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
    />
  );
}
