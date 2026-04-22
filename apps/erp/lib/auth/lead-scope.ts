import type { AccessContext } from "./access-context";
import {
  PERM_LEADS_SCOPE_ALL,
  PERM_LEADS_SCOPE_CREATOR,
  PERM_LEADS_SCOPE_CREATOR_AGENT,
} from "./permission-codes";

export type LeadScope =
  | { mode: "all" }
  | { mode: "none" }
  | { mode: "created_by"; userId: string }
  | { mode: "confirmed_by"; userId: string }
  | { mode: "created_or_confirmed"; userId: string };

/** Accès large type closer / direction commerciale (hors paramètres système réservés au super_admin côté UI). */
export function hasFullCommercialDataAccess(roleCodes: readonly string[]): boolean {
  return (
    roleCodes.includes("admin") ||
    roleCodes.includes("closer") ||
    roleCodes.includes("sales_director")
  );
}

function getLeadScopeLegacy(access: Extract<AccessContext, { kind: "authenticated" }>): LeadScope {
  const rc = access.roleCodes;
  if (rc.includes("super_admin")) {
    return { mode: "all" };
  }
  if (hasFullCommercialDataAccess(rc)) {
    return { mode: "all" };
  }
  if (rc.includes("sales_agent")) {
    return { mode: "created_by", userId: access.userId };
  }
  return { mode: "none" };
}

/**
 * Périmètre leads à partir de `permissionCodes` (union des rôles).
 * Retourne `null` si aucune permission en base — l’app retombe sur {@link getLeadScopeLegacy}.
 */
function getLeadScopeFromPermissions(
  access: Extract<AccessContext, { kind: "authenticated" }>,
): LeadScope | null {
  if (access.permissionCodes.length === 0) {
    return null;
  }

  const perm = new Set(access.permissionCodes);
  const rc = access.roleCodes;

  if (rc.includes("super_admin")) {
    return { mode: "all" };
  }

  if (perm.has(PERM_LEADS_SCOPE_ALL) || hasFullCommercialDataAccess(rc)) {
    return { mode: "all" };
  }

  const isAgent = rc.includes("sales_agent");
  if ((perm.has(PERM_LEADS_SCOPE_CREATOR_AGENT) || perm.has(PERM_LEADS_SCOPE_CREATOR)) && isAgent) {
    return { mode: "created_by", userId: access.userId };
  }

  return { mode: "none" };
}

export function getLeadScopeForAccess(access: AccessContext): LeadScope {
  if (access.kind !== "authenticated") {
    return { mode: "none" };
  }
  const fromDb = getLeadScopeFromPermissions(access);
  if (fromDb !== null) {
    return fromDb;
  }
  return getLeadScopeLegacy(access);
}

export function canAccessLeadRow(
  lead: {
    created_by_agent_id: string | null;
    confirmed_by_user_id: string | null;
  },
  access: AccessContext,
): boolean {
  const scope = getLeadScopeForAccess(access);
  if (scope.mode === "all") {
    return true;
  }
  if (scope.mode === "none") {
    return false;
  }
  if (scope.mode === "created_by") {
    return lead.created_by_agent_id === scope.userId;
  }
  return (
    lead.created_by_agent_id === scope.userId ||
    lead.confirmed_by_user_id === scope.userId
  );
}
