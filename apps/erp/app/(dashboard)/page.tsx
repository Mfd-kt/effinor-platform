import { getAccessContext } from "@/lib/auth/access-context";
import { resolveCockpitVariant } from "@/lib/auth/cockpit-variant";

import {
  AdminAgentDashboard,
  AdminDashboard,
  CloserDashboard,
  DafDashboard,
  InstallerDashboard,
  LeadQuantifierDashboard,
  MarketingHomeDashboard,
  SalesAgentDashboard,
  SalesDirectorDashboard,
  TechnicianDashboard,
  parseDashboardPeriod,
} from "@/features/dashboards";
import { DashboardDefault } from "@/features/dashboard/components/dashboard-default";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Aiguilleur des dashboards par rôle.
 *
 * Priorité (cf. resolveCockpitVariant) : super_admin → admin → sales_director →
 * daf → closer → sales_agent → technician → admin_agent → installer →
 * lead_generation_quantifier → marketing_manager (si seul rôle opérationnel restant) → default.
 *
 * Les vues mock-first vivent sous `features/dashboards/<role>/`. Le concept legacy
 * `manager` (CEE) a été retiré : son équivalent moderne est `sales_director`.
 */
export default async function DashboardPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return null;
  }

  const variant = await resolveCockpitVariant(access);
  const raw = await searchParams;
  const period = parseDashboardPeriod(raw.period);

  switch (variant) {
    case "super_admin":
    case "admin":
      return <AdminDashboard period={period} />;
    case "marketing_manager":
      return <MarketingHomeDashboard />;
    case "sales_director":
      return <SalesDirectorDashboard access={access} period={period} />;
    case "daf":
      return <DafDashboard period={period} />;
    case "closer":
      return <CloserDashboard period={period} />;
    case "sales_agent":
      return <SalesAgentDashboard period={period} />;
    case "technician":
      return <TechnicianDashboard period={period} />;
    case "admin_agent":
      return <AdminAgentDashboard period={period} />;
    case "installer":
      return <InstallerDashboard period={period} />;
    case "lead_generation_quantifier":
      return <LeadQuantifierDashboard userId={access.userId} />;
    default:
      return <DashboardDefault access={access} />;
  }
}
