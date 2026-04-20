import { redirect } from "next/navigation";

import { getAccessContext } from "@/lib/auth/access-context";
import { resolveCockpitVariant } from "@/lib/auth/cockpit-variant";
import {
  CockpitAdminView,
  CockpitAgentView,
  CockpitCloserView,
  CockpitConfirmateurView,
  CockpitDirectorView,
} from "@/features/dashboard/components/cockpit/cockpit-role-views";
import { DashboardDefault } from "@/features/dashboard/components/dashboard-default";
import { DashboardTechnician } from "@/features/dashboard/components/dashboard-technician";
import { LeadGenerationQuantifierDashboardView } from "@/features/lead-generation/components/lead-generation-quantifier-dashboard-view";
import { getLeadGenerationQuantifierPersonalDashboard } from "@/features/lead-generation/queries/get-lead-generation-quantifier-personal-dashboard";
import { DEFAULT_COCKPIT_FILTERS } from "@/features/dashboard/domain/cockpit";
import { parseCockpitFilters } from "@/features/dashboard/lib/cockpit-filters";
import { getCockpitBundle } from "@/features/dashboard/queries/get-cockpit-bundle";
import { getDashboardMetrics } from "@/features/dashboard/queries/get-dashboard-metrics";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return null;
  }

  const variant = await resolveCockpitVariant(access);
  if (variant === "default") {
    if (access.roleCodes.includes("lead_generation_quantifier")) {
      const quantifierData = await getLeadGenerationQuantifierPersonalDashboard(access.userId);
      return <LeadGenerationQuantifierDashboardView data={quantifierData} />;
    }
    return <DashboardDefault />;
  }

  if (variant === "technician") {
    return <DashboardTechnician access={access} />;
  }

  if (variant === "manager") {
    redirect("/cockpit");
  }

  const raw = await searchParams;
  const filters = { ...DEFAULT_COCKPIT_FILTERS, ...parseCockpitFilters(raw) };
  const includeAdminHealth = variant === "super_admin" || variant === "admin";

  const [metrics, bundle] = await Promise.all([
    getDashboardMetrics(access, filters.period),
    getCockpitBundle(access, filters, { includeAdminHealth, cockpitVariant: variant }),
  ]);

  switch (variant) {
    case "super_admin":
    case "admin":
      return <CockpitAdminView metrics={metrics} bundle={bundle} />;
    case "sales_director":
      return <CockpitDirectorView metrics={metrics} bundle={bundle} />;
    case "sales_agent":
      return await CockpitAgentView({ access, metrics, bundle });
    case "confirmer":
      return await CockpitConfirmateurView({ access, metrics, bundle });
    case "closer":
      return await CockpitCloserView({ access, metrics, bundle });
    default:
      return <DashboardDefault />;
  }
}
