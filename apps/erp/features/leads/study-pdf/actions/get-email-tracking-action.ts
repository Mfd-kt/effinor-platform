"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailTrackingRow } from "@/features/leads/study-pdf/queries/get-email-tracking";

export async function getEmailTrackingAction(
  leadId: string,
): Promise<EmailTrackingRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("email_tracking")
      .select("id, lead_id, recipient, subject, sent_at, opened_at, open_count, last_opened_at")
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: false })
      .limit(10);

    if (error) return [];
    return (data as EmailTrackingRow[]) ?? [];
  } catch {
    return [];
  }
}
