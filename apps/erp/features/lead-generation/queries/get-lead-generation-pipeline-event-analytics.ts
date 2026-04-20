import { createClient } from "@/lib/supabase/server";

import type { LeadGenerationAssignmentEventKind } from "../domain/lead-generation-assignment-event";
import { lgTable } from "../lib/lg-db";

export type LeadGenerationPipelineEventCounts = {
  sinceIso: string;
  /** Comptage par type d’événement. */
  byEventType: Partial<Record<LeadGenerationAssignmentEventKind, number>>;
  /** Total événements sur la période. */
  total: number;
};

function startIsoForDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Agrégation simple du journal pipeline sur une fenêtre glissante (pour dashboards).
 */
export async function getLeadGenerationPipelineEventCounts(input: {
  /** 1, 7 ou 30 typiquement. */
  windowDays: number;
}): Promise<LeadGenerationPipelineEventCounts> {
  const sinceIso = startIsoForDays(input.windowDays);
  const supabase = await createClient();
  const t = lgTable(supabase, "lead_generation_assignment_events");

  const { data, error } = await t
    .select("event_type")
    .gte("occurred_at", sinceIso);

  if (error) {
    throw new Error(`Analytics journal pipeline : ${error.message}`);
  }

  const byEventType: Partial<Record<LeadGenerationAssignmentEventKind, number>> = {};
  for (const row of data ?? []) {
    const et = (row as { event_type: string }).event_type as LeadGenerationAssignmentEventKind;
    byEventType[et] = (byEventType[et] ?? 0) + 1;
  }

  return {
    sinceIso,
    byEventType,
    total: data?.length ?? 0,
  };
}

export type LeadGenerationPipelineMilestoneSample = {
  assignment_id: string;
  agent_id: string;
  lead_generation_stock_id: string;
  assigned_event_at: string | null;
  first_contact_event_at: string | null;
  converted_event_at: string | null;
};

/**
 * Extrait un échantillon de jalons (vue SQL) pour calculs KPI custom côté app.
 */
export async function getLeadGenerationPipelineMilestoneSample(input: {
  limit: number;
}): Promise<LeadGenerationPipelineMilestoneSample[]> {
  const supabase = await createClient();
  const lim = Math.min(Math.max(1, input.limit), 500);

  const client = supabase as unknown as {
    from: (name: string) => {
      select: (cols: string) => { limit: (n: number) => Promise<{ data: unknown; error: { message: string } | null }> };
    };
  };
  const { data, error } = await client
    .from("lead_generation_assignment_event_milestones")
    .select("assignment_id, agent_id, lead_generation_stock_id, assigned_event_at, first_contact_event_at, converted_event_at")
    .limit(lim);

  if (error) {
    throw new Error(`Jalons pipeline : ${error.message}`);
  }

  return (data ?? []) as LeadGenerationPipelineMilestoneSample[];
}
