import type { AccessContext } from "./access-context";

export function hasPermission(access: AccessContext, code: string): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (access.roleCodes.includes("super_admin")) {
    return true;
  }
  return access.permissionCodes.includes(code);
}

/**
 * Si aucune permission n’est chargée depuis la base (migration non appliquée ou rôle sans ligne),
 * retombe sur la règle métier historique.
 */
export function hasPermissionOrLegacy(
  access: AccessContext,
  code: string,
  legacy: (a: Extract<AccessContext, { kind: "authenticated" }>) => boolean,
): boolean {
  if (access.kind !== "authenticated") {
    return false;
  }
  if (access.roleCodes.includes("super_admin")) {
    return true;
  }
  if (access.permissionCodes.length === 0) {
    return legacy(access);
  }
  return access.permissionCodes.includes(code);
}
