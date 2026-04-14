import { createAdminClient } from "@/lib/supabase/admin";

export type EmailAttachmentMeta = {
  filename: string;
  contentType: string;
  size: number;
  storageUrl: string;
  documentId?: string;
};

export type EmailAiAnalysis = {
  signed: boolean;
  urgent: boolean;
  callbackRequested: boolean;
  questionsAsked: boolean;
  negative: boolean;
  positive: boolean;
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  recommendedAction: string;
  tags: string[];
};

export type LeadEmailRow = {
  id: string;
  lead_id: string;
  direction: "sent" | "received";
  from_email: string;
  to_email: string;
  subject: string | null;
  html_body: string | null;
  text_body: string | null;
  gmail_message_id: string | null;
  email_date: string;
  tracking_id: string | null;
  attachments: EmailAttachmentMeta[];
  ai_analysis: EmailAiAnalysis | null;
  created_at: string;
};

export async function getLeadEmails(
  leadId: string,
): Promise<LeadEmailRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("lead_emails")
      .select("*")
      .eq("lead_id", leadId)
      .order("email_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[getLeadEmails]", error.message);
      return [];
    }

    return (data as LeadEmailRow[]) ?? [];
  } catch {
    return [];
  }
}
