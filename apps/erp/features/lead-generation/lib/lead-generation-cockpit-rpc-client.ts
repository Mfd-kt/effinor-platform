import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  LeadGenerationCockpitAgentRowRpc,
  LeadGenerationCockpitDispatchRpcRow,
  LeadGenerationCockpitPortfolioAgingRpcRow,
  LeadGenerationCockpitRecentEventRpcRow,
  LeadGenerationCockpitSummaryRpcRow,
  LeadGenerationCockpitVelocityRpcRow,
} from "../domain/lead-generation-cockpit-rpc";

type RpcSupabase = Pick<SupabaseClient, "rpc">;

function assertSingleRow<T>(rows: T[] | null, label: string): T {
  const r = rows?.[0];
  if (!r) {
    throw new Error(`${label} : réponse RPC vide`);
  }
  return r;
}

export async function rpcLeadGenerationCockpitSummary(
  client: RpcSupabase,
  params: {
    p_agent_id: string | null;
    p_window_end: string;
    p_period_start: string;
    p_prev_period_start: string;
  },
): Promise<LeadGenerationCockpitSummaryRpcRow> {
  const { data, error } = await client.rpc("lead_generation_cockpit_summary", {
    p_agent_id: params.p_agent_id,
    p_window_end: params.p_window_end,
    p_period_start: params.p_period_start,
    p_prev_period_start: params.p_prev_period_start,
  });
  if (error) {
    throw new Error(`RPC lead_generation_cockpit_summary : ${error.message}`);
  }
  return assertSingleRow(data as LeadGenerationCockpitSummaryRpcRow[] | null, "cockpit_summary");
}

export async function rpcLeadGenerationCockpitPortfolioAging(
  client: RpcSupabase,
  params: { p_agent_id: string | null; p_now: string },
): Promise<LeadGenerationCockpitPortfolioAgingRpcRow> {
  const { data, error } = await client.rpc("lead_generation_cockpit_portfolio_aging", {
    p_agent_id: params.p_agent_id,
    p_now: params.p_now,
  });
  if (error) {
    throw new Error(`RPC lead_generation_cockpit_portfolio_aging : ${error.message}`);
  }
  return assertSingleRow(data as LeadGenerationCockpitPortfolioAgingRpcRow[] | null, "cockpit_portfolio_aging");
}

export async function rpcLeadGenerationCockpitVelocityMetrics(
  client: RpcSupabase,
  params: {
    p_agent_id: string | null;
    p_window_start: string;
    p_window_end: string;
  },
): Promise<LeadGenerationCockpitVelocityRpcRow> {
  const { data, error } = await client.rpc("lead_generation_cockpit_velocity_metrics", {
    p_agent_id: params.p_agent_id,
    p_window_start: params.p_window_start,
    p_window_end: params.p_window_end,
  });
  if (error) {
    throw new Error(`RPC lead_generation_cockpit_velocity_metrics : ${error.message}`);
  }
  return assertSingleRow(data as LeadGenerationCockpitVelocityRpcRow[] | null, "cockpit_velocity_metrics");
}

export async function rpcLeadGenerationCockpitAgentRows(
  client: RpcSupabase,
  params: {
    p_agent_id: string | null;
    p_window_start: string;
    p_window_end: string;
  },
): Promise<LeadGenerationCockpitAgentRowRpc[]> {
  const { data, error } = await client.rpc("lead_generation_cockpit_agent_rows", {
    p_agent_id: params.p_agent_id,
    p_window_start: params.p_window_start,
    p_window_end: params.p_window_end,
  });
  if (error) {
    throw new Error(`RPC lead_generation_cockpit_agent_rows : ${error.message}`);
  }
  return (data ?? []) as LeadGenerationCockpitAgentRowRpc[];
}

export async function rpcLeadGenerationCockpitDispatchHealth(
  client: RpcSupabase,
  params: { p_window_end: string },
): Promise<LeadGenerationCockpitDispatchRpcRow> {
  const { data, error } = await client.rpc("lead_generation_cockpit_dispatch_health", {
    p_window_end: params.p_window_end,
  });
  if (error) {
    throw new Error(`RPC lead_generation_cockpit_dispatch_health : ${error.message}`);
  }
  return assertSingleRow(data as LeadGenerationCockpitDispatchRpcRow[] | null, "cockpit_dispatch_health");
}

export async function rpcLeadGenerationCockpitRecentEvents(
  client: RpcSupabase,
  params: {
    p_agent_id: string | null;
    p_window_start: string;
    p_window_end: string;
    p_limit: number;
  },
): Promise<LeadGenerationCockpitRecentEventRpcRow[]> {
  const { data, error } = await client.rpc("lead_generation_cockpit_recent_events", {
    p_agent_id: params.p_agent_id,
    p_window_start: params.p_window_start,
    p_window_end: params.p_window_end,
    p_limit: params.p_limit,
  });
  if (error) {
    throw new Error(`RPC lead_generation_cockpit_recent_events : ${error.message}`);
  }
  return (data ?? []) as LeadGenerationCockpitRecentEventRpcRow[];
}
