/** Suppression d’un lead (soft delete) : réservé au super administrateur. */
export function canDeleteLead(roleCodes: readonly string[]): boolean {
  return roleCodes.includes("super_admin");
}

/** Modifier l’agent ayant saisi le lead (`created_by_agent_id`) : réservé au super administrateur. */
export function canReassignLeadCreator(roleCodes: readonly string[]): boolean {
  return roleCodes.includes("super_admin");
}
