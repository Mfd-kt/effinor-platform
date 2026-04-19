import { escapeIlike } from "../queries/apply-lead-generation-stock-filters";
import type { GetLeadGenerationStockFilters } from "../queries/get-lead-generation-stock";

/**
 * Paramètres optionnels alignés sur {@link applyLeadGenerationStockFilters} pour la RPC
 * `dispatch_lead_generation_stock_claim` (périmètre dispatchable = ready_now + critères liste).
 */
export function buildDispatchLeadGenerationStockClaimRpcParams(
  filters: GetLeadGenerationStockFilters | undefined,
): {
  p_import_batch_id: string | null;
  p_source: string | null;
  p_city_ilike: string | null;
  p_company_name_ilike: string | null;
  p_closing_readiness_status: string | null;
  p_lead_tier: string | null;
  p_needs_contact_improvement: boolean | null;
  p_cee_sheet_id: string | null;
} {
  if (!filters) {
    return {
      p_import_batch_id: null,
      p_source: null,
      p_city_ilike: null,
      p_company_name_ilike: null,
      p_closing_readiness_status: null,
      p_lead_tier: null,
      p_needs_contact_improvement: null,
      p_cee_sheet_id: null,
    };
  }
  const company = filters.company_search?.trim();
  const city = filters.city?.trim();
  return {
    p_import_batch_id: filters.import_batch_id?.trim() ?? null,
    p_source: filters.source?.trim() ?? null,
    p_city_ilike: city ? `%${escapeIlike(city)}%` : null,
    p_company_name_ilike: company ? `%${escapeIlike(company)}%` : null,
    p_closing_readiness_status: filters.closing_readiness_status?.trim() ?? null,
    p_lead_tier: filters.lead_tier?.trim() ?? null,
    p_needs_contact_improvement: filters.needs_contact_improvement === true ? true : null,
    p_cee_sheet_id: filters.cee_sheet_id?.trim() ?? null,
  };
}
