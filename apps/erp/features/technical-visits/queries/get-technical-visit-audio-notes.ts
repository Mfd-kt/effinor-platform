import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type TechnicalVisitAudioNoteRow =
  Database["public"]["Tables"]["technical_visit_audio_notes"]["Row"];

export async function getTechnicalVisitAudioNotes(visitId: string): Promise<TechnicalVisitAudioNoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("technical_visit_audio_notes")
    .select("*")
    .eq("technical_visit_id", visitId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTechnicalVisitAudioNotes]", error.message);
    return [];
  }
  return data ?? [];
}
