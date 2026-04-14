import type { AiOpsDetectedIssue } from "../ai-ops-types";

const NORM = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[«»"']/g, "")
    .slice(0, 400);

/**
 * Nouveauté minimale : évite deux messages IA quasi identiques d’affilée.
 */
export function computeMessageNoveltyScore(previousAiBody: string | null, nextBody: string): number {
  if (!previousAiBody) return 1;
  const a = NORM(previousAiBody);
  const b = NORM(nextBody);
  if (!a || !b) return 1;
  if (a === b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.includes(shorter) && shorter.length >=40) return 0.2;
  let common = 0;
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  for (const w of b.split(/\s+/)) {
    if (wordsA.has(w)) common += 1;
  }
  const denom = Math.max(wordsA.size, 8);
  return Math.min(1, 1 - common / denom + 0.3);
}

export function shouldSuppressAiMessageAsDuplicate(
  previousAiBody: string | null,
  nextIssue: Pick<AiOpsDetectedIssue, "body" | "severity">,
): { suppress: boolean; reason?: string } {
  const score = computeMessageNoveltyScore(previousAiBody, nextIssue.body);
  const sev = String(nextIssue.severity ?? "info");
  if (score < 0.25 && sev !== "critical") {
    return { suppress: true, reason: "low_novelty" };
  }
  return { suppress: false };
}

export function hasUserRepliedSinceLastAi(params: {
  lastUserMessageAt: string | null;
  lastAiMessageAt: string | null;
}): boolean {
  const u = params.lastUserMessageAt ? new Date(params.lastUserMessageAt).getTime() : null;
  const a = params.lastAiMessageAt ? new Date(params.lastAiMessageAt).getTime() : null;
  if (u == null) return false;
  if (a == null) return true;
  return u > a;
}
