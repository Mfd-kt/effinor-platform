import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export type ReleaseLeadGenerationAssignmentsForInactiveAgentSummary = {
  targetAgentUserId: string;
  recycledAssignments: number;
  resetStockRows: number;
  unassignedOpenLeads: number;
  skippedTerminalCount: number;
  reason: string;
};

type ReleaseInactiveAgentRpcRow = {
  target_agent_user_id: string;
  released_assignments_count: number;
  released_stock_count: number;
  unassigned_open_leads_count: number;
  skipped_terminal_count: number;
  reason: string;
};

/**
 * Libère le portefeuille lead-generation d'un agent inactif.
 *
 * Règle métier:
 * - ne libère que les assignations actives et non terminales (outcome pending)
 * - ne rouvre jamais les fiches terminales (stock converted/rejected/archived/expired)
 * - remet les fiches exploitables dans le pool global (stock ready + assignment null)
 */
export async function releaseLeadGenerationAssignmentsForInactiveAgent(
  agentUserId: string,
  input?: { admin?: SupabaseClient; reason?: string; actorUserId?: string | null },
): Promise<ReleaseLeadGenerationAssignmentsForInactiveAgentSummary> {
  const admin = input?.admin ?? createAdminClient();
  const { data, error } = await admin.rpc("release_lead_generation_assignments_for_inactive_agent", {
    p_agent_user_id: agentUserId,
    p_reason: input?.reason ?? "inactive_user",
    p_actor_user_id: input?.actorUserId ?? null,
  });

  if (error) {
    throw new Error(`Libération stock agent inactif (RPC): ${error.message}`);
  }

  const row = (Array.isArray(data) ? data[0] : data) as ReleaseInactiveAgentRpcRow | null;
  if (!row) {
    return {
      targetAgentUserId: agentUserId,
      recycledAssignments: 0,
      resetStockRows: 0,
      unassignedOpenLeads: 0,
      skippedTerminalCount: 0,
      reason: input?.reason ?? "inactive_user",
    };
  }

  return {
    targetAgentUserId: row.target_agent_user_id,
    recycledAssignments: row.released_assignments_count,
    resetStockRows: row.released_stock_count,
    unassignedOpenLeads: row.unassigned_open_leads_count,
    skippedTerminalCount: row.skipped_terminal_count,
    reason: row.reason,
  };
}

