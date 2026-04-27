import type { AccessContext } from "./access-context";

/**
 * Qui peut consulter le journal d’activité LGC (assignations / appels) d’un agent.
 * - L’agent pour lui-même
 * - Direction / admin (pilotage)
 */
export function canViewAgentLeadGenWorkHistory(
  access: AccessContext,
  subjectUserId: string,
): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (access.userId === subjectUserId) {
    return true;
  }
  const rc = access.roleCodes;
  return (
    rc.includes("super_admin") ||
    rc.includes("admin") ||
    rc.includes("sales_director")
  );
}
