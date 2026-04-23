import { LeadGenerationManagementDashboardView } from "@/features/lead-generation/components/lead-generation-management-dashboard-view";
import {
  getLeadGenerationManagementDashboard,
  type ManagementDashboardPeriod,
} from "@/features/lead-generation/queries/get-lead-generation-management-dashboard";

type Props = {
  period: ManagementDashboardPeriod;
  quantifierUserId: string | null;
  ceeSheetId: string | null;
};

export async function LeadGenerationManagementSuiviContent({
  period,
  quantifierUserId,
  ceeSheetId,
}: Props) {
  const data = await getLeadGenerationManagementDashboard({
    period,
    quantifierUserId,
    ceeSheetId,
  });
  return <LeadGenerationManagementDashboardView data={data} embedded />;
}
