import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadGenerationCockpitDashboard } from "@/features/lead-generation/components/lead-generation-cockpit-dashboard";
import { LeadGenerationCockpitFilters } from "@/features/lead-generation/components/lead-generation-cockpit-filters";
import { LeadGenerationManagementDashboardView } from "@/features/lead-generation/components/lead-generation-management-dashboard-view";
import { LeadGenerationTeamPilotageShell } from "@/features/lead-generation/components/lead-generation-team-pilotage-shell";
import type { LeadGenerationCockpitFilters as CockpitFilters } from "@/features/lead-generation/domain/lead-generation-cockpit";
import { buildTeamPilotageTabHrefs } from "@/features/lead-generation/lib/team-pilotage-url";
import { loadLeadGenerationCockpit } from "@/features/lead-generation/queries/load-lead-generation-cockpit";
import { getLeadGenerationAssignableAgents } from "@/features/lead-generation/queries/get-lead-generation-assignable-agents";
import {
  getLeadGenerationManagementDashboard,
  type ManagementDashboardPeriod,
} from "@/features/lead-generation/queries/get-lead-generation-management-dashboard";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationManagementDashboard } from "@/lib/auth/module-access";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseManagementPeriod(p: string | undefined): ManagementDashboardPeriod {
  if (p === "today" || p === "7d" || p === "30d") {
    return p;
  }
  return "7d";
}

function parseCockpitFiltersFromSearch(sp: { period?: string; agent?: string }): CockpitFilters {
  const p = sp.period?.trim();
  const period = p === "24h" || p === "7d" || p === "30d" ? p : "7d";
  const agent = sp.agent?.trim();
  return { period, agentId: agent && agent.length > 0 ? agent : null };
}

export default async function LeadGenerationManagementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getAccessContext();

  if (access.kind !== "authenticated" || !(await canAccessLeadGenerationManagementDashboard(access))) {
    notFound();
  }

  const sp = await searchParams;
  const { view, suiviHref, cockpitHref } = buildTeamPilotageTabHrefs(sp);

  if (view === "cockpit") {
    const filters = parseCockpitFiltersFromSearch({
      period: typeof sp.period === "string" ? sp.period : undefined,
      agent: typeof sp.agent === "string" ? sp.agent : undefined,
    });

    const [data, agents] = await Promise.all([
      loadLeadGenerationCockpit(filters),
      getLeadGenerationAssignableAgents(),
    ]);

    return (
      <LeadGenerationTeamPilotageShell
        activeView="cockpit"
        suiviHref={suiviHref}
        cockpitHref={cockpitHref}
      >
        <Suspense
          fallback={
            <div className="h-20 animate-pulse rounded-xl border border-border bg-muted/40" aria-hidden />
          }
        >
          <LeadGenerationCockpitFilters
            agents={agents.map((a) => ({ id: a.id, displayName: a.displayName }))}
          />
        </Suspense>

        <LeadGenerationCockpitDashboard data={data} />
      </LeadGenerationTeamPilotageShell>
    );
  }

  const pRaw = typeof sp.p === "string" ? sp.p : undefined;
  const qRaw = typeof sp.q === "string" ? sp.q : undefined;
  const ceeRaw = typeof sp.cee === "string" ? sp.cee : undefined;

  const period = parseManagementPeriod(pRaw);
  const quantifierUserId = qRaw && UUID_RE.test(qRaw) ? qRaw : null;
  const ceeSheetId = ceeRaw && UUID_RE.test(ceeRaw) ? ceeRaw : null;

  const data = await getLeadGenerationManagementDashboard({
    period,
    quantifierUserId,
    ceeSheetId,
  });

  return (
    <LeadGenerationTeamPilotageShell activeView="suivi" suiviHref={suiviHref} cockpitHref={cockpitHref}>
      <LeadGenerationManagementDashboardView data={data} embedded />
    </LeadGenerationTeamPilotageShell>
  );
}
