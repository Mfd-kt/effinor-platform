import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Tables `lead_generation_*` absentes du typage généré : accès typé en `never`
 * jusqu’à régénération `supabase gen types`.
 */
export function lgTable(
  client: SupabaseClient,
  name:
    | "lead_generation_stock"
    | "lead_generation_import_batches"
    | "lead_generation_assignments"
    | "lead_generation_assignment_activities"
    | "lead_generation_manual_reviews"
    | "lead_generation_automation_runs"
    | "lead_generation_pipeline_runs"
    | "lead_generation_settings",
): ReturnType<SupabaseClient["from"]> {
  /** Cast : tables absentes du `Database` généré ; chaînage PostgREST conservé pour l’exécution. */
  return client.from(name as never) as ReturnType<SupabaseClient["from"]>;
}
