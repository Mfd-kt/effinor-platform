/**
 * Payloads bruts renvoyés par les RPC `lead_generation_cockpit_*` (snake_case SQL).
 * Les queries cockpit mappent vers les types domaine `LeadGenerationCockpit*`.
 */

export type LeadGenerationCockpitSummaryRpcRow = {
  stock_neuf_total: number;
  suivi_total: number;
  sla_warning_total: number;
  sla_breached_total: number;
  agents_suspendus_total: number;
  conversions_24h: number;
  conversions_7d: number;
  conversions_period: number;
  conversions_previous_period: number;
};

export type LeadGenerationCockpitPortfolioAgingRpcRow = {
  new_lt_2h: number;
  new_gt_2h: number;
  contacted_lt_24h: number;
  contacted_gt_24h: number;
  follow_up_due_today: number;
  follow_up_overdue: number;
};

export type LeadGenerationCockpitVelocityRpcRow = {
  avg_assignment_to_first_contact_seconds: number | null;
  avg_assignment_to_conversion_seconds: number | null;
  avg_first_contact_to_conversion_seconds: number | null;
  first_contact_within_2h_count: number;
  converted_within_24h_from_assign_count: number;
  milestones_sample_size: number;
  sample_size_first_contact_pair: number;
  sample_size_conversion_pair: number;
  conversions_in_period: number;
};

export type LeadGenerationCockpitAgentRowRpc = {
  agent_id: string;
  agent_name: string;
  agent_email: string | null;
  stock_neuf: number;
  suivi_total: number;
  sla_warning: number;
  sla_breached: number;
  appels_total: number;
  first_contacts_total: number;
  converted_total: number;
  avg_assignment_to_first_contact_seconds: number | null;
  avg_assignment_to_conversion_seconds: number | null;
  effective_cap_multiplier: number;
  effective_stock_cap: number;
  injection_suspended: boolean;
  suspension_reason: string | null;
};

export type LeadGenerationCockpitDispatchRpcRow = {
  agents_eligibles: number;
  agents_suspendus: number;
  agents_total_sales: number;
  avg_effective_cap: number;
  assigned_count_24h: number;
  assigned_count_7d: number;
  dispatch_blocked_count_24h: number;
  dispatch_blocked_count_7d: number;
  dispatch_resumed_count_24h: number;
  dispatch_resumed_count_7d: number;
  top_block_reasons: Array<{ reason: string; count: number }> | null;
  recent_dispatch_events: LeadGenerationCockpitDispatchRecentEventRpc[] | null;
};

export type LeadGenerationCockpitDispatchRecentEventRpc = {
  id: string;
  event_type: string;
  occurred_at: string;
  agent_id: string;
  agent_display_name: string;
  summary: string;
};

export type LeadGenerationCockpitRecentEventRpcRow = {
  id: string;
  event_type: string;
  occurred_at: string;
  agent_id: string;
  assignment_id: string | null;
  metadata_json: Record<string, unknown>;
  agent_display_name: string;
};
