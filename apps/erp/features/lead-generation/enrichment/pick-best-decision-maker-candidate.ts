import type { LeadGenerationDecisionMakerConfidence, LeadGenerationDecisionMakerSource } from "../domain/statuses";
import {
  type LeadGenerationDecisionMakerRolePriority,
  decisionMakerRolePriorityRank,
  inferDecisionMakerRolePriorityFromRoleText,
} from "../domain/decision-maker-role-priority";

import type { DecisionMakerCandidate } from "./extract-decision-maker-from-text";

export type ScoredDecisionMakerCandidate = DecisionMakerCandidate & {
  rolePriority: LeadGenerationDecisionMakerRolePriority | null;
};

function confidenceRank(c: LeadGenerationDecisionMakerConfidence): number {
  if (c === "high") return 3;
  if (c === "medium") return 2;
  return 1;
}

/** Score interne pour choisir le meilleur candidat sans bruit (plus haut = meilleur). */
export function scoreDecisionMakerCandidate(c: ScoredDecisionMakerCandidate): number {
  const cr = confidenceRank(c.confidence);
  const rp = c.rolePriority ? 7 - decisionMakerRolePriorityRank(c.rolePriority) : 0;
  const hasName = c.name?.trim() ? 4 : 0;
  const hasRole = c.role?.trim() ? 3 : 0;
  const sourceBonus: Record<LeadGenerationDecisionMakerSource, number> = {
    linkedin: 3,
    dropcontact: 2,
    website: 2,
    google: 1,
  };
  return cr * 100 + rp * 10 + hasName + hasRole + sourceBonus[c.source];
}

export function attachRolePriority(
  c: DecisionMakerCandidate | null,
): ScoredDecisionMakerCandidate | null {
  if (!c) return null;
  return {
    ...c,
    rolePriority: inferDecisionMakerRolePriorityFromRoleText(c.role),
  };
}

export function pickBestDecisionMakerCandidate(
  candidates: ScoredDecisionMakerCandidate[],
): ScoredDecisionMakerCandidate | null {
  if (candidates.length === 0) return null;
  let best = candidates[0]!;
  let bestScore = scoreDecisionMakerCandidate(best);
  for (let i = 1; i < candidates.length; i += 1) {
    const c = candidates[i]!;
    const s = scoreDecisionMakerCandidate(c);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}
