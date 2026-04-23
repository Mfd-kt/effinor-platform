import type { ReactNode } from "react";

import {
  LeadGenShell,
  type LeadGenTabsAccess,
} from "@/features/lead-generation/components/lead-gen-shell";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  canAccessLeadGenerationHub,
  canAccessLeadGenerationManagementDashboard,
  canAccessLeadGenerationMyQueue,
  canAccessLeadGenerationQuantifierImports,
} from "@/lib/auth/module-access";

export default async function LeadGenerationLayout({ children }: { children: ReactNode }) {
  const access = await getAccessContext();
  const access_ = access.kind === "authenticated" ? access : null;

  const hub = access_ ? await canAccessLeadGenerationHub(access_) : false;
  const management = access_ ? await canAccessLeadGenerationManagementDashboard(access_) : false;
  const quantifierImports = access_ ? canAccessLeadGenerationQuantifierImports(access_) : false;
  const myQueue = access_ ? canAccessLeadGenerationMyQueue(access_) : false;

  const tabsAccess: LeadGenTabsAccess = {
    stock: hub,
    imports: hub || quantifierImports,
    myQueue,
    management,
    settings: hub,
  };

  return <LeadGenShell access={tabsAccess}>{children}</LeadGenShell>;
}
