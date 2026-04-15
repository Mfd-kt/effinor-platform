import type { AccessContext } from "@/lib/auth/access-context";
import { hasRole } from "@/lib/auth/role-codes";

/** Soft-delete d’une VT (liste / fiche) : administrateurs plateforme uniquement. */
export function canAdminSoftDeleteTechnicalVisit(access: AccessContext): boolean {
  if (access.kind !== "authenticated") return false;
  return hasRole(access.roleCodes, "admin", "super_admin");
}
