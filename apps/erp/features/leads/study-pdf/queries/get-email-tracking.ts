import { createAdminClient } from "@/lib/supabase/admin";

export type EmailTrackingRow = {
  id: string;
  lead_id: string | null;
  recipient: string;
  subject: string | null;
  sent_at: string;
  opened_at: string | null;
  open_count: number;
  last_opened_at: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_by: string | null;
};

export async function getEmailTrackingForLead(
  leadId: string,
): Promise<EmailTrackingRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("email_tracking")
      .select("id, lead_id, recipient, subject, sent_at, opened_at, open_count, last_opened_at, user_agent, ip_address, created_by")
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[getEmailTrackingForLead]", error.message);
      return [];
    }

    return (data as EmailTrackingRow[]) ?? [];
  } catch {
    return [];
  }
}
