/** Suppression d’un lead (soft delete) : réservé au super administrateur. */
export function canDeleteLead(roleCodes: readonly string[]): boolean {
  return roleCodes.includes("super_admin");
}

/** Modifier l’agent ayant saisi le lead (`created_by_agent_id`) : réservé au super administrateur. */
export function canReassignLeadCreator(roleCodes: readonly string[]): boolean {
  return roleCodes.includes("super_admin");
}

/** Réattribuer agent / confirmateur / closer sur un workflow fiche CEE : réservé au super administrateur. */
export function canReassignWorkflowRoles(roleCodes: readonly string[]): boolean {
  return roleCodes.includes("super_admin");
}

/**
 * Rôles applicatifs autorisés à changer de fiche CEE (workflow complet), hors manager d’équipe CEE
 * (`userIsActiveCeeTeamManager` côté serveur).
 */
export function canSwitchLeadCeeSheetByAppRole(roleCodes: readonly string[]): boolean {
  return (
    roleCodes.includes("super_admin") ||
    roleCodes.includes("confirmer") ||
    roleCodes.includes("closer")
  );
}
