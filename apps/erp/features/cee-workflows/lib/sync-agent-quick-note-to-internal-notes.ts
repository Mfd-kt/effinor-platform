import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import type { Database, Json } from "@/types/database.types";

/** Clé privée dans `simulation_input_json` : dernière valeur des « notes rapides » agent (dédup). */
export const AGENT_PROSPECT_NOTES_SYNC_KEY = "__effinor_agent_prospect_notes_sync";

export function extractSyncedProspectNotesFromSimulationJson(json: unknown): string {
  if (!json || typeof json !== "object" || Array.isArray(json)) return "";
  const v = (json as Record<string, unknown>)[AGENT_PROSPECT_NOTES_SYNC_KEY];
  return typeof v === "string" ? v : "";
}

/** Ajoute / retire la clé de synchro sans écraser le reste du JSON simulation. */
export function mergeProspectNotesSyncIntoSimulationJson(
  base: Json | undefined,
  prospectNotesTrimmed: string,
): Json {
  const obj = base && typeof base === "object" && !Array.isArray(base) ? { ...(base as Record<string, unknown>) } : {};
  if (prospectNotesTrimmed) {
    obj[AGENT_PROSPECT_NOTES_SYNC_KEY] = prospectNotesTrimmed;
  } else {
    delete obj[AGENT_PROSPECT_NOTES_SYNC_KEY];
  }
  return obj as Json;
}

/**
 * Pousse les notes rapides simulateur / poste agent vers le fil des notes internes,
 * uniquement si le texte a changé par rapport à la valeur déjà enregistrée dans le workflow.
 * Ne touche pas à `leads.recording_notes` (réservé transcription / IA audio).
 */
export async function insertAgentProspectQuickNoteIfChanged(
  supabase: SupabaseClient<Database>,
  access: Extract<AccessContext, { kind: "authenticated" }>,
  leadId: string,
  previousSyncedFromWorkflow: string,
  nextNotesFromForm: string | null | undefined,
): Promise<void> {
  const prev = (previousSyncedFromWorkflow ?? "").trim();
  const next = (nextNotesFromForm ?? "").trim();
  if (!next || next === prev) {
    return;
  }

  const block = await getRestrictedAgentLeadEditBlockReason(supabase, access, leadId);
  if (block) {
    return;
  }

  const { data: leadRow, error } = await supabase
    .from("leads")
    .select("id, created_by_agent_id, confirmed_by_user_id")
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !leadRow) {
    return;
  }
  if (!canAccessLeadRow(leadRow, access)) {
    return;
  }

  const body = `Notes rapides (poste agent)\n\n${next}`;
  const { error: insErr } = await supabase.from("lead_internal_notes").insert({
    lead_id: leadId,
    body,
    created_by: access.userId,
  });

  if (insErr) {
    console.error("[insertAgentProspectQuickNoteIfChanged]", insErr.message);
  }
}

/** Aperçu « notes » dans les listes agent : notes rapides (workflow) puis repli transcription. */
export function resolveAgentActivityNotesPreview(
  simulationInputJson: Json | null | undefined,
  recordingNotes: string | null | undefined,
): string | null {
  const fromSim = extractSyncedProspectNotesFromSimulationJson(simulationInputJson ?? null).trim();
  if (fromSim) return fromSim;
  const r = recordingNotes?.trim();
  return r || null;
}
