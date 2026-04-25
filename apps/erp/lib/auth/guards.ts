import { notFound } from "next/navigation";

import { isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";

import type { AccessContext } from "./access-context";
import { getAccessContext } from "./access-context";
import { isMarketingStaff, isSalesDirector, isSuperAdmin } from "./role-codes";

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

/**
 * Réglages « Utilisateurs » : super administrateur ou manager d’équipe CEE actif (création d’utilisateurs encadrée côté actions).
 */
export async function requireUsersSettingsAccess(): Promise<Extract<AccessContext, { kind: "authenticated" }>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    notFound();
  }
  if (isSuperAdmin(access.roleCodes)) {
    return access;
  }
  if (await isCeeTeamManager(access.userId)) {
    return access;
  }
  notFound();
}

/**
 * Module Marketing (blog + réalisations) : super_admin, admin, marketing_manager.
 */
export async function requireMarketingStaff(): Promise<Extract<AccessContext, { kind: "authenticated" }>> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !isMarketingStaff(access.roleCodes)) {
    notFound();
  }
  return access;
}
