import { createClient } from "@/lib/supabase/server";

import type { LeadInternalNoteWithAuthor } from "@/features/leads/types";

type NoteRow = {
  id: string;
  body: string;
  created_at: string;
  created_by: string;
  author: { full_name: string | null; email: string; avatar_url: string | null } | null;
};

export async function getLeadInternalNotes(leadId: string): Promise<LeadInternalNoteWithAuthor[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_internal_notes")
    .select(
      `
      id,
      body,
      created_at,
      created_by,
      author:profiles!created_by (
        full_name,
        email,
        avatar_url
      )
    `,
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Impossible de charger les notes internes : ${error.message}`);
  }

  const rows = (data ?? []) as unknown as NoteRow[];

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    created_by: row.created_by,
    author: row.author
      ? {
          id: row.created_by,
          full_name: row.author.full_name,
          email: row.author.email,
          avatar_url: row.author.avatar_url,
        }
      : null,
  }));
}
