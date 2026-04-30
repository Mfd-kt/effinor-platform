const CONVERT_LEAD_TYPE_ROLE_CODES = [
  "super_admin",
  "admin",
  "closer",
  "sales_director",
  "sales_agent",
] as const;

/**
 * Indique si l'utilisateur peut déclencher une conversion de type de lead (Phase 2.3.B.1).
 * Durcissement futur : affiner par périmètre métier (Phase 2.3.C / 2.4).
 */
export function canConvertLeadType(roleCodes: readonly string[]): boolean {
  return CONVERT_LEAD_TYPE_ROLE_CODES.some((code) => roleCodes.includes(code));
}
