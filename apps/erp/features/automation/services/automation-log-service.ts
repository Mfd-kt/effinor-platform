import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import type { AutomationLogStatus, AutomationType } from "@/features/automation/domain/types";
import type { Database, Json } from "@/types/database.types";

export type AutomationLogInsert = {
  automationType: AutomationType;
  ruleId?: string | null;
  workflowId?: string | null;
  leadId?: string | null;
  dedupeKey?: string | null;
  status: AutomationLogStatus;
  slackChannel?: string | null;
  slackEventType?: string | null;
  resultJson?: Record<string, unknown>;
  errorMessage?: string | null;
};

type Supabase = SupabaseClient<Database>;

async function insertAutomationLogWithClient(supabase: Supabase, row: AutomationLogInsert): Promise<void> {
  const payload = (row.resultJson ?? {}) as Json;
  const { error } = await supabase.from("automation_logs").insert({
    automation_type: row.automationType,
    rule_id: row.ruleId ?? null,
    workflow_id: row.workflowId ?? null,
    lead_id: row.leadId ?? null,
    dedupe_key: row.dedupeKey ?? null,
    status: row.status,
    slack_channel: row.slackChannel ?? null,
    slack_event_type: row.slackEventType ?? null,
    result_json: payload,
    error_message: row.errorMessage ?? null,
  });
  if (error) {
    console.warn("[automation] insertAutomationLog failed:", error.message);
  }
}

/**
 * Persistance best-effort (session utilisateur).
 */
export async function insertAutomationLog(row: AutomationLogInsert): Promise<void> {
  try {
    const supabase = await createClient();
    await insertAutomationLogWithClient(supabase, row);
  } catch (e) {
    console.warn("[automation] insertAutomationLog exception:", e instanceof Error ? e.message : e);
  }
}

/** Pour jobs serveur sans session (ex. cron avec service role). */
export async function insertAutomationLogSupabase(supabase: Supabase, row: AutomationLogInsert): Promise<void> {
  try {
    await insertAutomationLogWithClient(supabase, row);
  } catch (e) {
    console.warn("[automation] insertAutomationLogSupabase exception:", e instanceof Error ? e.message : e);
  }
}
