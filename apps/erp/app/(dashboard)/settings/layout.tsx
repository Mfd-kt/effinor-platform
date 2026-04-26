import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { SettingsShell, type SettingsTabsAccess } from "@/components/settings/settings-shell";
import { isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";
import { getAccessContext } from "@/lib/auth/access-context";
import { isSuperAdmin } from "@/lib/auth/role-codes";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    notFound();
  }

  const super_ = isSuperAdmin(access.roleCodes);
  const orgAdmin = access.roleCodes.includes("admin");
  const teamMgr = !super_ && !orgAdmin && (await isCeeTeamManager(access.userId));

  const tabsAccess: SettingsTabsAccess = {
    users: super_ || orgAdmin || teamMgr,
    roles: super_,
    products: super_,
  };

  return <SettingsShell access={tabsAccess}>{children}</SettingsShell>;
}
