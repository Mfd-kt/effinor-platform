import { createClient } from "@/lib/supabase/server";
import type { LeadStudyDocumentRow } from "@/features/leads/study-pdf/domain/types";

export async function getLeadStudyDocuments(leadId: string): Promise<LeadStudyDocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_documents")
    .select("*")
    .eq("lead_id", leadId)
    .in("document_type", ["study_pdf", "accord_commercial", "received_document"])
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("lead_documents")) {
      return [];
    }
    throw new Error(`Impossible de charger les études PDF: ${error.message}`);
  }

  return (data ?? []) as LeadStudyDocumentRow[];
}
