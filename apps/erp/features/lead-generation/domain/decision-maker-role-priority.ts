/**
 * Priorité métier des rôles extraits (1 = le plus pertinent pour le closing B2B terrain).
 * Ne pas inventer : dérivé uniquement du texte de rôle déjà extrait.
 */
export type LeadGenerationDecisionMakerRolePriority =
  | "owner_executive"
  | "site_director"
  | "maintenance_manager"
  | "technical_manager"
  | "energy_manager"
  | "general_exec";

/** Ordre croissant = plus fort (pour comparaisons : plus petit = meilleur). */
export const DECISION_MAKER_ROLE_PRIORITY_RANK: Record<LeadGenerationDecisionMakerRolePriority, number> = {
  owner_executive: 1,
  site_director: 2,
  maintenance_manager: 3,
  technical_manager: 4,
  energy_manager: 5,
  general_exec: 6,
};

export function decisionMakerRolePriorityRank(
  p: LeadGenerationDecisionMakerRolePriority | null | undefined,
): number {
  if (!p) return 99;
  return DECISION_MAKER_ROLE_PRIORITY_RANK[p] ?? 99;
}

/**
 * Classe le texte de fonction extrait (littéral) vers une priorité stable.
 */
export function inferDecisionMakerRolePriorityFromRoleText(
  role: string | null | undefined,
): LeadGenerationDecisionMakerRolePriority | null {
  if (!role || !role.trim()) return null;
  const t = role.toLowerCase();

  if (
    /\b(pd|pdg|président|president|gérant|gerant|gérante|directeur\s+général|directrice\s+générale|dg\b|ceo\b|dirigeant|dirigeante|chef\s+d['']entreprise)\b/i.test(
      t,
    )
  ) {
    return "owner_executive";
  }
  if (/\b(directeur\s+de\s+site|directrice\s+de\s+site|directeur\s+d['']exploitation|directrice\s+d['']exploitation)\b/i.test(t)) {
    return "site_director";
  }
  if (/\b(responsable\s+maintenance|chef\s+maintenance|coordinateur\s+maintenance)\b/i.test(t)) {
    return "maintenance_manager";
  }
  if (
    /\b(responsable\s+technique|directeur\s+technique|directrice\s+technique|responsable\s+travaux|chef\s+de\s+projets?\s+techniques?)\b/i.test(
      t,
    )
  ) {
    return "technical_manager";
  }
  if (/\b(énergie|energie|rse\s+.*énergie|acheteur\s+énergie)\b/i.test(t)) {
    return "energy_manager";
  }
  if (/\b(directeur|directrice|responsable|manager|chef\s+de\s+service)\b/i.test(t)) {
    return "general_exec";
  }
  return null;
}

export function isStrongerOrEqualRolePriority(
  existing: LeadGenerationDecisionMakerRolePriority | null | undefined,
  proposed: LeadGenerationDecisionMakerRolePriority | null | undefined,
): boolean {
  if (!proposed) return true;
  if (!existing) return false;
  return decisionMakerRolePriorityRank(proposed) <= decisionMakerRolePriorityRank(existing);
}
