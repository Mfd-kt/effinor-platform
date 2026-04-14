import { syncLeadEmails } from "@/features/leads/actions/sync-lead-emails";
import { createAdminClient } from "@/lib/supabase/admin";

export type LeadEmailSyncCronResult =
  | {
      ok: true;
      executedAt: string;
      durationMs: number;
      leadsEligible: number;
      leadsProcessed: number;
      syncOk: number;
      syncFailed: number;
      totalNewEmails: number;
      totalAttachments: number;
      errors: { leadId: string; error: string }[];
    }
  | { ok: false; executedAt: string; error: string };

function parseMaxLeads(): number {
  const raw = process.env.LEAD_EMAIL_SYNC_CRON_MAX_LEADS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 120;
  if (!Number.isFinite(n) || n < 1) return 120;
  return Math.min(n, 500);
}

/**
 * Synchronise Gmail → `lead_emails` pour un lot de leads (email non vide).
 * Appelé par le cron HTTP ; pas de session utilisateur (pièces jointes : `created_by` null).
 */
export async function runLeadEmailSyncCron(): Promise<LeadEmailSyncCronResult> {
  const executedAt = new Date().toISOString();
  const started = Date.now();

  if (!process.env.GMAIL_USER?.trim()) {
    return {
      ok: false,
      executedAt,
      error: "GMAIL_USER non configuré — synchronisation Gmail désactivée.",
    };
  }

  const maxLeads = parseMaxLeads();
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("leads")
    .select("id, email")
    .is("deleted_at", null)
    .not("email", "is", null)
    .order("updated_at", { ascending: false })
    .limit(maxLeads);

  if (error) {
    return {
      ok: false,
      executedAt,
      error: error.message,
    };
  }

  const eligible =
    rows?.filter((r) => typeof r.email === "string" && r.email.trim().includes("@")) ?? [];

  let syncOk = 0;
  let syncFailed = 0;
  let totalNewEmails = 0;
  let totalAttachments = 0;
  const errors: { leadId: string; error: string }[] = [];

  for (const row of eligible) {
    const email = row.email!.trim();
    const res = await syncLeadEmails(row.id, email);
    if (res.ok) {
      syncOk++;
      totalNewEmails += res.synced;
      totalAttachments += res.attachmentsSaved;
    } else {
      syncFailed++;
      errors.push({ leadId: row.id, error: res.error });
    }
  }

  return {
    ok: true,
    executedAt,
    durationMs: Date.now() - started,
    leadsEligible: eligible.length,
    leadsProcessed: eligible.length,
    syncOk,
    syncFailed,
    totalNewEmails,
    totalAttachments,
    errors: errors.slice(0, 20),
  };
}
