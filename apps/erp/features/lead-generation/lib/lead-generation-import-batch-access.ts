import type { AccessContext } from "@/lib/auth/access-context";
import {
  canAccessAdminCeeSheets,
  canAccessLeadGenerationHub,
  canAccessLeadGenerationQuantification,
} from "@/lib/auth/module-access";
import { isCeeTeamManager } from "@/features/dashboard/queries/get-managed-teams-context";

/**
 * Accès fiche lot / synchronisation / retry : hub côté sujet, lot créé par le quantificateur,
 * ou impersonation avec acteur ayant un périmètre pilotage lead gen (admin ne « garde » pas le hub du sujet).
 */
export async function canAccessLeadGenerationImportBatchAsUser(
  access: AccessContext,
  batch: { created_by_user_id: string | null },
): Promise<boolean> {
  if (access.kind !== "authenticated") return false;
  if (await canAccessLeadGenerationHub(access)) return true;
  if (canAccessLeadGenerationQuantification(access) && batch.created_by_user_id === access.userId) return true;
  if (access.impersonation) {
    if (
      canAccessAdminCeeSheets({
        kind: "authenticated",
        userId: access.actorUserId,
        actorUserId: access.actorUserId,
        roleCodes: access.actorRoleCodes,
        actorRoleCodes: access.actorRoleCodes,
        email: null,
        fullName: null,
        permissionCodes: [],
        impersonation: null,
      })
    ) {
      return true;
    }
    if (await isCeeTeamManager(access.actorUserId)) return true;
  }
  return false;
}
