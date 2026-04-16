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
import { getLeadSheetWorkflowsForLead } from "@/features/cee-workflows/queries/get-lead-sheet-workflows";
import { LeadCrmRightRail } from "@/features/leads/components/lead-crm-right-rail";
import { LeadRealtimeListener } from "@/features/leads/components/lead-realtime-listener";
import type { AgentProspectFormValue } from "@/features/cee-workflows/components/agent-prospect-form";
import { contactDisplayName } from "@/features/leads/lib/contact-map";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import type { LeadDetailRow } from "@/features/leads/types";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";
import { canAccessCeeWorkflowsModule } from "@/lib/auth/module-access";
import { isRestrictedAgentLeadConsultationReadOnly } from "@/lib/auth/restricted-agent-lead-edit";
import { createClient } from "@/lib/supabase/server";
import { isoToDatetimeLocal } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";

type AgentSimulatorLeadSession = { leadId: string } & AgentProspectFormValue;

function buildSimulatorSessionFromLead(lead: LeadDetailRow): AgentSimulatorLeadSession {
  return {
    leadId: lead.id,
    companyName: lead.company_name,
    civility: lead.civility ?? "",
    contactName: contactDisplayName(lead) ?? lead.contact_name?.trim() ?? "",
    phone: lead.phone ?? "",
    callbackAt: isoToDatetimeLocal(lead.callback_at),
    email: lead.email ?? "",
    address: lead.worksite_address ?? "",
    city: lead.worksite_city ?? "",
    postalCode: lead.worksite_postal_code ?? "",
    notes: lead.recording_notes ?? "",
  };
}

type PageProps = {
  searchParams?: Promise<{ lead?: string; simulator?: string }>;
};

export default async function AgentPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessCeeWorkflowsModule(access)) {
    notFound();
  }

  const sp = searchParams ? await searchParams : undefined;
  const leadId = typeof sp?.lead === "string" && sp.lead.trim() ? sp.lead.trim() : undefined;
  const openSimulator =
    typeof sp?.simulator === "string" &&
    (sp.simulator === "1" || sp.simulator.toLowerCase() === "true");

  const [dashboard, destratProducts, commercialCallbacks, leadForSheet] = await Promise.all([
    getAgentDashboardData(access, undefined, {
      restrictToLeadsCreatedByCurrentUser: !hasFullCeeWorkflowAccess(access),
    }),
    getAgentDestratSimulatorProducts(),
    fetchCommercialCallbacksForAgentWorkstation(access),
    leadId ? getLeadById(leadId, access) : Promise.resolve(null),
  ]);

  const ceeWorkflowsForContextLead =
    leadForSheet != null ? await getLeadSheetWorkflowsForLead(leadForSheet.id, access) : [];

  const supabase = await createClient();
  const agentLeadRailReadOnly =
    leadForSheet != null ? await isRestrictedAgentLeadConsultationReadOnly(supabase, access, leadForSheet.id) : false;

  const initialSheetId =
    leadForSheet != null
      ? resolvePreferredCeeSheetIdForLead(dashboard.sheets, {
          cee_sheet_id: leadForSheet.cee_sheet_id,
        })
      : null;

  const initialSimulatorSession =
    leadForSheet != null && openSimulator ? buildSimulatorSessionFromLead(leadForSheet) : null;

  const callbackKpis = computeCommercialCallbackKpis(commercialCallbacks);
  const callbackPerformance = computeCallbackPerformanceStats(commercialCallbacks);

  return (
    <div>
      {leadForSheet ? <LeadRealtimeListener leadId={leadForSheet.id} /> : null}
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "min-w-0",
            leadForSheet &&
              "lg:pr-[calc(28rem+2rem)] xl:pr-[calc(31rem+2.25rem)] 2xl:pr-[calc(34rem+2.5rem)]",
          )}
        >
          <AgentWorkstation
            sheets={dashboard.sheets}
            activity={dashboard.activity}
            destratProducts={destratProducts}
            commercialCallbacks={commercialCallbacks}
            callbackKpis={callbackKpis}
            callbackPerformance={callbackPerformance}
            initialSheetId={initialSheetId}
            initialSimulatorSession={initialSimulatorSession}
          />
        </div>
        {leadForSheet ? (
          <LeadCrmRightRail
            lead={leadForSheet}
            workflows={ceeWorkflowsForContextLead.map((w) => ({ id: w.id, cee_sheet: w.cee_sheet }))}
            readOnly={agentLeadRailReadOnly}
          />
        ) : null}
      </div>
    </div>
  );
}
