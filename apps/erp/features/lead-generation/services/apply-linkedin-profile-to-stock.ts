import type { LeadGenerationDecisionMakerConfidence } from "../domain/statuses";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import {
  decisionMakerRolePriorityRank,
  inferDecisionMakerRolePriorityFromRoleText,
  type LeadGenerationDecisionMakerRolePriority,
} from "../domain/decision-maker-role-priority";
import { extractFromLinkedInTitle } from "../enrichment/extract-decision-maker-from-text";

function pickString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() !== "") return c.trim();
  }
  return null;
}

function confidenceRank(c: LeadGenerationDecisionMakerConfidence | null | undefined): number {
  if (c === "high") return 3;
  if (c === "medium") return 2;
  if (c === "low") return 1;
  return 0;
}

export type LinkedInProfileExtract = {
  name: string | null;
  role: string | null;
  company: string | null;
  city: string | null;
};

/**
 * Extraction conservative depuis un item dataset Apify (champs réels uniquement).
 */
export function extractLinkedInProfileFromApifyItem(item: Record<string, unknown>): LinkedInProfileExtract {
  const headline = pickString(item.headline, item.title, item.jobTitle, item.occupation);
  const fn = pickString(item.firstName, item.first_name);
  const ln = pickString(item.lastName, item.last_name);
  const joined = fn && ln ? `${fn} ${ln}`.trim() : fn || ln || null;
  const fullName = pickString(item.fullName, item.full_name, joined);
  let name: string | null = fullName;
  let role: string | null = null;
  if (headline) {
    const fromTitle = extractFromLinkedInTitle(headline);
    if (fromTitle) {
      name = name ?? fromTitle.name;
      role = fromTitle.role ?? role;
    } else if (!role && headline.length <= 120) {
      role = headline;
    }
  }
  return {
    name,
    role,
    company: pickString(item.companyName, item.company, item.organization),
    city: pickString(item.city, item.locality, item.location),
  };
}

/**
 * Ne met à jour le décideur que si la qualité proposée est au moins aussi bonne (confiance + priorité de rôle).
 */
export function shouldApplyLinkedInDecisionMakerPatch(input: {
  row: LeadGenerationStockRow;
  proposedName: string | null;
  proposedRole: string | null;
}): boolean {
  const { row, proposedName, proposedRole } = input;
  if (!proposedName?.trim() && !proposedRole?.trim()) return false;

  const existingConfRank = confidenceRank(row.decision_maker_confidence ?? null);
  const proposedConfRank = 3;
  if (proposedConfRank < existingConfRank) return false;

  const existingP =
    (row.decision_maker_role_priority as LeadGenerationDecisionMakerRolePriority | null) ??
    inferDecisionMakerRolePriorityFromRoleText(row.decision_maker_role);
  const proposedP = inferDecisionMakerRolePriorityFromRoleText(proposedRole);

  if (existingConfRank === proposedConfRank && proposedP && existingP) {
    if (decisionMakerRolePriorityRank(proposedP) > decisionMakerRolePriorityRank(existingP)) {
      return false;
    }
  }

  if (row.decision_maker_name?.trim() && proposedName?.trim()) {
    const a = row.decision_maker_name.trim().toLowerCase();
    const b = proposedName.trim().toLowerCase();
    if (a !== b && a.length > 3 && b.length > 3 && !a.includes(b) && !b.includes(a)) {
      return false;
    }
  }

  return true;
}
