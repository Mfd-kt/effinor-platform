import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";

import type { AccessContext } from "./access-context";
import { canAccessInstallationsPage } from "./installations-access";
import { hasFullCeeWorkflowAccess } from "./cee-workflows-scope";
import {
  canAccessAdminCeeSheets,
  canAccessCeeWorkflowsModule,
  canAccessLeadGenerationQuantification,
  canAccessLeadGenerationQuantifierImports,
  canAccessCloserWorkspace,
  canAccessCockpitRoute,
  canAccessLeadsDirectoryNav,
  canAccessLostLeadsInbox,
  canAccessTechnicalVisitsDirectoryNav,
  shouldHideTerrainSuiviSidebar,
  shouldShowLeadGenerationMyQueueNav,
  shouldUseLeanLeadGenerationHubSidebar,
} from "./module-access";

/** Liens `/lead-generation` affichés au menu quand {@link shouldUseLeanLeadGenerationHubSidebar} est vrai. */
const LEAN_LEAD_GENERATION_SIDEBAR_HREFS = new Set([
  "/lead-generation",
  "/lead-generation/management",
  "/lead-generation/settings",
]);

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
  const base = shouldHideTerrainSuiviSidebar(access)
    ? [...CORE_HREFS].filter((h) => h !== "/tasks")
    : [...CORE_HREFS];
  const extra: string[] = [];
  const ceeTeamManager = await isCeeTeamManager(access.userId);

  if (hasFullCeeWorkflowAccess(access)) {
    extra.push("/commercial-callbacks");
  }
  if (canAccessAdminCeeSheets(access)) {
    extra.push("/admin/technical-visit-templates");
  }
  if (canAccessAdminCeeSheets(access) || ceeTeamManager) {
    extra.push("/lead-generation");
    extra.push("/lead-generation/settings");
    extra.push("/lead-generation/imports");
    extra.push("/lead-generation/automation");
    extra.push("/lead-generation/analytics");
    extra.push("/lead-generation/learning");
    extra.push("/lead-generation/management");
  }
  if (shouldShowLeadGenerationMyQueueNav(access)) {
    extra.push("/lead-generation/my-queue");
  }
  if (canAccessLeadGenerationQuantification(access)) {
    extra.push("/lead-generation/quantification");
  }
  if (canAccessLeadGenerationQuantifierImports(access)) {
    extra.push("/lead-generation/imports");
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

  const uniq = (paths: string[]) => [...new Set(paths)];

  const merged = uniq([...base, ...extra]);
  const lean =
    access.kind === "authenticated" && (await shouldUseLeanLeadGenerationHubSidebar(access));
  const navigable = lean
    ? merged.filter(
        (h) => !h.startsWith("/lead-generation") || LEAN_LEAD_GENERATION_SIDEBAR_HREFS.has(h),
      )
    : merged;

  if (rc.includes("super_admin")) {
    return uniq([
      ...navigable,
      "/settings/users",
      "/settings/roles",
      "/settings/products",
    ]);
  }
  if (ceeTeamManager) {
    return uniq([...navigable, "/settings/users"]);
  }
  return navigable;
}
