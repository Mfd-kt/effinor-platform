import type { AccessContext } from "./access-context";

/**
 * Entités exposées dans la matrice permissions (trois domaines).
 */
export const TABLE_SCOPE_ENTITY_KEYS = ["leads", "technical_visits", "installations"] as const;

export type TableScopeEntityKey = (typeof TABLE_SCOPE_ENTITY_KEYS)[number];

export function permScopeAllCode(entity: string): string {
  return `perm.${entity}.scope_all`;
}

export function permScopeCreatorCode(entity: string): string {
  return `perm.${entity}.scope_creator`;
}

/**
 * Accès au module (liste / fiches) : au moins une visibilité sur l'entité
 * (`scope_all` ou `scope_creator`), ou ancien `perm.access.*`, ou repli legacy.
 */
export function hasTableScopeModuleAccess(
  access: AccessContext,
  entity: TableScopeEntityKey,
  legacyAccessPerm: string,
  legacyFn: (a: Extract<AccessContext, { kind: "authenticated" }>) => boolean,
): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (access.roleCodes.includes("super_admin")) {
    return true;
  }
  if (access.permissionCodes.length === 0) {
    return legacyFn(access);
  }
  const pc = new Set(access.permissionCodes);
  if (
    pc.has(permScopeAllCode(entity)) ||
    pc.has(permScopeCreatorCode(entity)) ||
    pc.has(legacyAccessPerm)
  ) {
    return true;
  }
  return false;
}
