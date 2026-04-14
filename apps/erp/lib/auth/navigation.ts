import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import type { AccessContext } from "./access-context";
import { canAccessInstallationsPage } from "./installations-access";
import { hasFullCeeWorkflowAccess } from "./cee-workflows-scope";
import {
  canAccessAdminCeeSheets,
  canAccessCeeWorkflowsModule,
  canAccessCloserWorkspace,
  canAccessCockpitRoute,
  canAccessConfirmateurWorkspace,
  canAccessLeadsDirectoryNav,
  canAccessLostLeadsInbox,
  canAccessTechnicalVisitsDirectoryNav,
} from "./module-access";

const CORE_HREFS = ["/", "/tasks", "/account", "/agent-operations", "/digests"] as const;

/** Liens sidebar : domaines matrice + réglages super admin. */
export async function buildAllowedNavHrefs(
  supabase: SupabaseClient<Database>,
  access: AccessContext,
): Promise<string[]> {
  if (access.kind !== "authenticated") {
    return [];
  }
  const rc = access.roleCodes;
  const base = [...CORE_HREFS];
  const extra: string[] = [];

  if (canAccessCeeWorkflowsModule(access)) {
    extra.push("/agent");
  }
  if (hasFullCeeWorkflowAccess(access)) {
    extra.push("/commercial-callbacks");
  }
  if (canAccessConfirmateurWorkspace(access)) {
    extra.push("/confirmateur");
  }
  if (canAccessCloserWorkspace(access)) {
    extra.push("/closer");
  }
  if (canAccessAdminCeeSheets(access)) {
    extra.push("/admin/cee-sheets");
  }
  if (canAccessLeadsDirectoryNav(access)) {
    extra.push("/leads");
  }
  if (await canAccessLostLeadsInbox(access)) {
    extra.push("/leads/lost");
  }
  if (await canAccessTechnicalVisitsDirectoryNav(access)) {
    extra.push("/technical-visits");
  }
  if (await canAccessInstallationsPage(supabase, access)) {
    extra.push("/installations");
  }
  if (await canAccessCockpitRoute(access)) {
    extra.push("/cockpit");
  }

  if (rc.includes("super_admin")) {
    return [...base, ...extra, "/settings/users", "/settings/roles", "/settings/cee", "/settings/products"];
  }
  return [...base, ...extra];
}
