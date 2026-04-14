import type { AccessContext } from "@/lib/auth/access-context";
import { hasFullCeeWorkflowAccess } from "@/lib/auth/cee-workflows-scope";
import { canAccessCeeWorkflowsModule } from "@/lib/auth/module-access";

export function canAccessCommercialCallbacks(access: AccessContext): boolean {
  return access.kind === "authenticated" && canAccessCeeWorkflowsModule(access);
}

/** Direction commerciale / admin CEE : vue de tous les rappels et actions de pilotage (ex. suppression). */
export function canAccessCommercialCallbacksTeamOverview(access: AccessContext): boolean {
  return access.kind === "authenticated" && hasFullCeeWorkflowAccess(access);
}
