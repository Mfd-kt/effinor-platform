import { CeeSheetAdminShell } from "@/features/cee-workflows/components/admin/cee-sheet-admin-shell";
import { getAdminCeeNetworkOverview } from "@/features/cee-workflows/queries/get-admin-cee-network-overview";
import { getAdminCeeSheets } from "@/features/cee-workflows/queries/get-admin-cee-sheets";
import { getCeeSheetTeamWithMembers } from "@/features/cee-workflows/queries/get-cee-sheet-team-with-members";
import { listAssignableProfiles } from "@/features/cee-workflows/queries/list-assignable-profiles";
import { requireCeeAdminAccess } from "@/lib/auth/guards";

export default async function AdminCeeSheetsPage() {
  await requireCeeAdminAccess();

  const [sheets, profiles, networkOverview] = await Promise.all([
    getAdminCeeSheets(),
    listAssignableProfiles(),
    getAdminCeeNetworkOverview(),
  ]);

  const teams = await Promise.all(
    sheets.map(async (sheet) => [sheet.id, await getCeeSheetTeamWithMembers(sheet.id)] as const),
  );

  const teamsBySheetId = Object.fromEntries(teams);

  return (
    <CeeSheetAdminShell
      sheets={sheets}
      teamsBySheetId={teamsBySheetId}
      profiles={profiles}
      networkOverview={networkOverview}
    />
  );
}
