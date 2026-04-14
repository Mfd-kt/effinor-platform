import type { SupabaseClient } from "@supabase/supabase-js";

import { formatDateTimeFr } from "@/lib/format";

type NoteExportRow = {
  body: string;
  created_at: string;
  author: { full_name: string | null; email: string } | null;
};

/**
 * Texte concaténé des notes internes (pour observations VT / bénéficiaire).
 */
export async function fetchLeadInternalNotesPlainBlock(
  supabase: SupabaseClient,
  leadId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("lead_internal_notes")
    .select(
      `
      body,
      created_at,
      author:profiles!created_by (
        full_name,
        email
      )
    `,
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error || !data?.length) {
    return "";
  }

  const rows = data as unknown as NoteExportRow[];
  return rows
    .map((row) => {
      const name = row.author?.full_name?.trim() || row.author?.email?.trim() || "—";
      const when = formatDateTimeFr(row.created_at);
      return `[${when} — ${name}]\n${row.body.trim()}`;
    })
    .join("\n\n---\n\n");
}
