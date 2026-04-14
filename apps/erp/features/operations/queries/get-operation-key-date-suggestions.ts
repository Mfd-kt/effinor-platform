import type { SupabaseClient } from "@supabase/supabase-js";

import { isoToDateInput } from "@/features/operations/lib/datetime";
import type { SuggestedKeyDates } from "@/features/operations/lib/merge-suggested-key-dates";
import type { Database, TechnicalVisitStatus } from "@/types/database.types";

/** Date seule `YYYY-MM-DD` ou horodatage ISO → valeur formulaire `YYYY-MM-DD` (jour local). */
function toDateInputValue(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return isoToDateInput(t);
}

const PERFORMED_LIKE: TechnicalVisitStatus[] = [
  "performed",
  "report_pending",
  "validated",
];

/**
 * Propose les dates « Dates clés » à partir des données métier liées :
 * - VT de réf. : performed_at (ou créneau planifié si statut « effectuée » sans heure)
 * - Devis (quotes) : 1er issue_date → envoi ; dernier signed_at → signature
 * - Installations : min(start_date), max(end_date)
 * - Factures client : 1er issue_date → acompte ; dernier paid_at → paiement prime si présent
 * - Facture délégataire : date d’émission en secours pour paiement prime
 */
export async function getOperationKeyDateSuggestions(
  supabase: SupabaseClient<Database>,
  params: {
    operationId?: string | null;
    referenceTechnicalVisitId?: string | null;
  },
): Promise<SuggestedKeyDates> {
  const out: SuggestedKeyDates = {};
  // Tables hors générique Database (quotes, installations, invoices, delegate_invoices).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = supabase;
  const vtId = params.referenceTechnicalVisitId?.trim() || null;
  const opId = params.operationId?.trim() || null;

  if (vtId) {
    const { data: vt, error: vtErr } = await supabase
      .from("technical_visits")
      .select("performed_at, scheduled_at, status")
      .eq("id", vtId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!vtErr && vt) {
      let iso: string | null = vt.performed_at;
      if (!iso && PERFORMED_LIKE.includes(vt.status as TechnicalVisitStatus)) {
        iso = vt.scheduled_at;
      }
      if (iso) {
        out.technical_visit_date = isoToDateInput(iso);
      }
    }
  }

  if (!opId) {
    return out;
  }

  const { data: quotes, error: qErr } = await q
    .from("quotes")
    .select("issue_date, signed_at")
    .eq("operation_id", opId)
    .order("issue_date", { ascending: true });

  if (!qErr && quotes && quotes.length > 0) {
    const first = quotes[0] as { issue_date?: string; signed_at?: string | null };
    if (first.issue_date) {
      out.quote_sent_at = toDateInputValue(first.issue_date);
    }
    let latestSigned: string | null = null;
    for (const row of quotes as { signed_at?: string | null }[]) {
      if (row.signed_at) {
        if (!latestSigned || row.signed_at > latestSigned) latestSigned = row.signed_at;
      }
    }
    if (latestSigned) {
      out.quote_signed_at = isoToDateInput(latestSigned);
    }
  }

  const { data: inst, error: iErr } = await q
    .from("installations")
    .select("start_date, end_date")
    .eq("operation_id", opId);

  if (!iErr && inst && inst.length > 0) {
    const starts: string[] = [];
    const ends: string[] = [];
    for (const row of inst as { start_date?: string | null; end_date?: string | null }[]) {
      if (row.start_date) starts.push(row.start_date);
      if (row.end_date) ends.push(row.end_date);
    }
    starts.sort();
    ends.sort();
    if (starts.length > 0) {
      out.installation_start_at = toDateInputValue(starts[0]);
    }
    if (ends.length > 0) {
      out.installation_end_at = toDateInputValue(ends[ends.length - 1]);
    }
  }

  const { data: invs, error: invErr } = await q
    .from("invoices")
    .select("issue_date, paid_at")
    .eq("operation_id", opId)
    .order("issue_date", { ascending: true });

  if (!invErr && invs && invs.length > 0) {
    const rows = invs as { issue_date?: string; paid_at?: string | null }[];
    const firstIssue = rows[0]?.issue_date;
    if (firstIssue) {
      out.deposit_date = toDateInputValue(firstIssue);
    }
    let latestPaid: string | null = null;
    for (const r of rows) {
      if (r.paid_at) {
        if (!latestPaid || r.paid_at > latestPaid) latestPaid = r.paid_at;
      }
    }
    if (latestPaid) {
      out.prime_paid_at = isoToDateInput(latestPaid);
    }
  }

  if (!out.prime_paid_at) {
    const { data: del, error: dErr } = await q
      .from("delegate_invoices")
      .select("issue_date")
      .eq("operation_id", opId)
      .order("issue_date", { ascending: false })
      .limit(1);

    if (!dErr && del && del.length > 0) {
      const row = del[0] as { issue_date?: string };
      if (row.issue_date) {
        out.prime_paid_at = toDateInputValue(row.issue_date);
      }
    }
  }

  return out;
}
