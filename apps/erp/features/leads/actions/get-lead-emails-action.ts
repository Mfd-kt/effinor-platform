"use server";

import { getLeadEmails, type LeadEmailRow } from "@/features/leads/queries/get-lead-emails";

export async function getLeadEmailsAction(leadId: string): Promise<LeadEmailRow[]> {
  return getLeadEmails(leadId);
}
