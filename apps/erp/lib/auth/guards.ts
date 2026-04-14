import { notFound } from "next/navigation";

import type { AccessContext } from "./access-context";
import { getAccessContext } from "./access-context";
import { isSalesDirector, isSuperAdmin } from "./role-codes";

/**
 * Coupe l’accès aux pages réservées au super administrateur (404 si non autorisé).
 */
export async function requireSuperAdmin(): Promise<Extract<AccessContext, { kind: "authenticated" }>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isSuperAdmin(access.roleCodes)) {
    notFound();
  }
  return access;
}

export async function requireCeeAdminAccess(): Promise<Extract<AccessContext, { kind: "authenticated" }>> {
  const access = await getAccessContext();
  if (
    access.kind !== "authenticated" ||
    !(
      isSuperAdmin(access.roleCodes) ||
      access.roleCodes.includes("admin") ||
      isSalesDirector(access.roleCodes)
    )
  ) {
    notFound();
  }
  return access;
}
