import type { AccessContext } from "@/lib/auth/access-context";

const PILOTAGE_ROLE_CODES = new Set(["manager", "admin", "super_admin", "confirmer"]);

export function canViewTechnicalVisitPilotageAlerts(access: AccessContext): boolean {
  if (access.kind !== "authenticated") return false;
  return access.roleCodes.some((c) => PILOTAGE_ROLE_CODES.has(c));
}

export function canManageTechnicalVisitPilotageAlerts(access: AccessContext): boolean {
  return canViewTechnicalVisitPilotageAlerts(access);
}
