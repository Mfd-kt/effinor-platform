import { ACTIVE_TECHNICAL_VISIT_STATUSES } from "@/features/leads/constants/technical-visit-active-statuses";
import { createClient } from "@/lib/supabase/server";

/** Visite « active » au sens index partiel (unicité par workflow). */
export async function getActiveTechnicalVisitIdForWorkflow(workflowId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technical_visits")
    .select("id")
    .eq("workflow_id", workflowId)
    .is("deleted_at", null)
    .in("status", [...ACTIVE_TECHNICAL_VISIT_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}
