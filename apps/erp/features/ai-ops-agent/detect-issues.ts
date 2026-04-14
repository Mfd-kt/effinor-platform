import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { detectBadlyHandledLeads } from "./detect-badly-handled-leads";
import { detectCallbackNeglect } from "./detect-callback-neglect";
import { detectMissingFields } from "./detect-missing-fields";
import { detectStalledWorkflows } from "./detect-stalled-workflows";
import { detectUserNeedsHelp } from "./detect-user-needs-help";
import { detectSlaBreachesForAiOps } from "./detect-sla-from-internal-sla";
import type { AiOpsDetectedIssue } from "./ai-ops-types";
import { buildAiOpsDedupeKey } from "./lib/ai-ops-dedupe";
import { groupRelatedIssuesForUser } from "./lib/group-related-issues";
import { computeAiOpsPriority, computeAiOpsSeverity } from "./lib/ai-ops-priority";

type Admin = SupabaseClient<Database>;

export function normalizeAiOpsDetectedIssue(issue: AiOpsDetectedIssue): AiOpsDetectedIssue {
  const severity = issue.severity ?? computeAiOpsSeverity(issue);
  const withSev = { ...issue, severity };
  return {
    ...withSev,
    priority: computeAiOpsPriority(withSev),
    dedupeKey: buildAiOpsDedupeKey(withSev),
  };
}

/** Issues brutes (une ligne par entité détectée), avant regroupement. */
export async function detectIssuesRaw(admin: Admin, now: Date): Promise<AiOpsDetectedIssue[]> {
  const [a, b, c, d, e, f] = await Promise.all([
    detectCallbackNeglect(admin, now),
    detectBadlyHandledLeads(admin, now),
    detectStalledWorkflows(admin),
    detectMissingFields(admin),
    detectUserNeedsHelp(admin),
    detectSlaBreachesForAiOps(admin, now),
  ]);
  return [...a, ...b, ...c, ...d, ...e, ...f];
}

export async function detectIssues(admin: Admin, now: Date): Promise<AiOpsDetectedIssue[]> {
  const flat = await detectIssuesRaw(admin, now);
  return groupRelatedIssuesForUser(flat.map(normalizeAiOpsDetectedIssue));
}
