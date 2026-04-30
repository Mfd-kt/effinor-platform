import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export type LeadWorkflowActivityEventRow = {
  id: string;
  lead_sheet_workflow_id: string;
  event_type: string;
  event_label: string;
  payload_json: Json;
  created_at: string;
  created_by_profile: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

/** Entrée unifiée workflow + journal `lead_activity_events` (Phase 2.3.C.2 — UI timeline en 2.4+). */
export type LeadActivityTimelineEntry =
  | {
      kind: "workflow";
      id: string;
      lead_sheet_workflow_id: string;
      event_type: string;
      event_label: string;
      payload_json: Json;
      created_at: string;
      created_by_profile: LeadWorkflowActivityEventRow["created_by_profile"];
    }
  | {
      kind: "lead_activity";
      id: string;
      event_type: string;
      created_at: string;
      actor_user_id: string | null;
      metadata: Record<string, unknown>;
    };

const COMBINED_TIMELINE_LIMIT = 120;

/**
 * Événements d’activité (transitions, envois, etc.) pour tous les workflows CEE d’un lead.
 */
export async function getLeadWorkflowActivityEvents(
  workflowIds: string[],
): Promise<LeadWorkflowActivityEventRow[]> {
  if (workflowIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_sheet_workflow_events")
    .select(
      "id, lead_sheet_workflow_id, event_type, event_label, payload_json, created_at, created_by_profile:profiles!created_by_user_id(id, full_name, email)",
    )
    .in("lead_sheet_workflow_id", workflowIds)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as LeadWorkflowActivityEventRow[];
}

/**
 * Fusionne les événements workflow et `lead_activity_events` pour un lead, tri décroissant par date.
 * Non branché sur `LeadActivityTimeline` tant que Phase 2.4 — la fonction existante reste inchangée.
 */
export async function getLeadActivityTimelineCombined(
  workflowIds: string[],
  leadId: string,
): Promise<LeadActivityTimelineEntry[]> {
  const supabase = await createClient();

  const [workflowEvents, activityResult] = await Promise.all([
    workflowIds.length === 0
      ? Promise.resolve([] as LeadWorkflowActivityEventRow[])
      : getLeadWorkflowActivityEvents(workflowIds),
    supabase
      .from("lead_activity_events")
      .select("id, event_type, created_at, actor_user_id, metadata")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  if (activityResult.error) {
    console.error(
      "[getLeadActivityTimelineCombined] lead_activity_events",
      leadId,
      activityResult.error,
    );
  }

  const workflowEntries: LeadActivityTimelineEntry[] = workflowEvents.map((e) => ({
    kind: "workflow",
    id: e.id,
    lead_sheet_workflow_id: e.lead_sheet_workflow_id,
    event_type: e.event_type,
    event_label: e.event_label,
    payload_json: e.payload_json,
    created_at: e.created_at,
    created_by_profile: e.created_by_profile,
  }));

  const rawActivity = activityResult.error ? [] : (activityResult.data ?? []);
  const activityEntries: LeadActivityTimelineEntry[] = rawActivity.map((row) => {
    const meta = row.metadata;
    return {
      kind: "lead_activity",
      id: row.id,
      event_type: row.event_type,
      created_at: row.created_at,
      actor_user_id: row.actor_user_id,
      metadata:
        meta && typeof meta === "object" && !Array.isArray(meta)
          ? (meta as Record<string, unknown>)
          : {},
    };
  });

  const merged = [...workflowEntries, ...activityEntries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return merged.slice(0, COMBINED_TIMELINE_LIMIT);
}
