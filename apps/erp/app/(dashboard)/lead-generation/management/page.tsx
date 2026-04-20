import { notFound } from "next/navigation";

import { LeadGenerationManagementDashboardView } from "@/features/lead-generation/components/lead-generation-management-dashboard-view";
import {
  getLeadGenerationManagementDashboard,
  type ManagementDashboardPeriod,
} from "@/features/lead-generation/queries/get-lead-generation-management-dashboard";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadGenerationManagementDashboard } from "@/lib/auth/module-access";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parsePeriod(p: string | undefined): ManagementDashboardPeriod {
  if (p === "today" || p === "7d" || p === "30d") {
    return p;
  }
  return "7d";
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
  const pRaw = typeof sp.p === "string" ? sp.p : undefined;
  const qRaw = typeof sp.q === "string" ? sp.q : undefined;
  const ceeRaw = typeof sp.cee === "string" ? sp.cee : undefined;

  const period = parsePeriod(pRaw);
  const quantifierUserId = qRaw && UUID_RE.test(qRaw) ? qRaw : null;
  const ceeSheetId = ceeRaw && UUID_RE.test(ceeRaw) ? ceeRaw : null;

  const data = await getLeadGenerationManagementDashboard({
    period,
    quantifierUserId,
    ceeSheetId,
  });

  return <LeadGenerationManagementDashboardView data={data} />;
}
