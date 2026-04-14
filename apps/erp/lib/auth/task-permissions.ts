import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadsDirectoryNav } from "@/lib/auth/module-access";

/** Direction commerciale / admin : créer une tâche et l’assigner à un collaborateur. */
export function canAssignTasksToTeam(access: AccessContext): boolean {
  return canAccessLeadsDirectoryNav(access);
}
