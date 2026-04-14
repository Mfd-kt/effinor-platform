import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessLeadRow } from "@/lib/auth/lead-scope";
import { getRestrictedAgentLeadEditBlockReason } from "@/lib/auth/restricted-agent-lead-edit";
import type { Database } from "@/types/database.types";

/**
 * Recopie les « notes rapides » du poste agent dans le fil chronologique des notes internes du lead,
 * uniquement lorsque le texte a changé par rapport à `recording_notes` en base (évite les doublons à l’enregistrement sans modification).
 */
export async function syncAgentQuickNoteToInternalNotes(
  supabase: SupabaseClient<Database>,
  access: Extract<AccessContext, { kind: "authenticated" }>,
  leadId: string,
  previousRecordingNotes: string | null | undefined,
  nextNotesFromForm: string | null | undefined,
): Promise<void> {
  const prev = (previousRecordingNotes ?? "").trim();
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
    console.error("[syncAgentQuickNoteToInternalNotes]", insErr.message);
  }
}
