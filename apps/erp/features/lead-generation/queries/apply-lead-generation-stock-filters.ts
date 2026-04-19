import type { GetLeadGenerationStockFilters } from "./get-lead-generation-stock";

export function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Même prédicats que la liste paginée — pour comptages et agrégations.
 * (Builder PostgREST Supabase — chaînage conservé.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyLeadGenerationStockFilters(q: any, f: GetLeadGenerationStockFilters | undefined): any {
  if (!f) return q;
  if (f.stock_status) {
    q = q.eq("stock_status", f.stock_status);
  }
  if (f.qualification_status) {
    q = q.eq("qualification_status", f.qualification_status);
  }
  if (f.source) {
    q = q.eq("source", f.source);
  }
  if (f.city?.trim()) {
    q = q.ilike("city", escapeIlike(f.city.trim()));
  }
  if (f.company_search?.trim()) {
    const term = `%${escapeIlike(f.company_search.trim())}%`;
    q = q.ilike("company_name", term);
  }
  if (f.dispatch_queue_status?.trim()) {
    q = q.eq("dispatch_queue_status", f.dispatch_queue_status.trim());
  }
  if (f.lead_tier?.trim()) {
    q = q.eq("lead_tier", f.lead_tier.trim());
  }
  if (f.closing_readiness_status?.trim()) {
    q = q.eq("closing_readiness_status", f.closing_readiness_status.trim());
  }
  if (f.needs_contact_improvement === true) {
    q = q
      .eq("stock_status", "ready")
      .is("duplicate_of_stock_id", null)
      .neq("qualification_status", "rejected")
      .neq("qualification_status", "duplicate")
      .not("phone", "is", null)
      .neq("phone", "")
      .in("enrichment_status", ["not_started", "failed"])
      .or("email.is.null,website.is.null");
  }
  if (f.import_batch_id?.trim()) {
    q = q.eq("import_batch_id", f.import_batch_id.trim());
  }
  if (f.import_batch_ids && f.import_batch_ids.length > 0) {
    q = q.in("import_batch_id", f.import_batch_ids);
  }
  return q;
}
