import type { LeadGenerationStockRow } from "../domain/stock-row";

/** Aligné sur la file `/lead-generation/quantification`. */
export function isLeadGenerationStockInQuantificationQueue(row: LeadGenerationStockRow): boolean {
  if (row.qualification_status !== "pending" && row.qualification_status !== "to_validate") return false;
  if (row.converted_lead_id != null) return false;
  if (row.current_assignment_id != null) return false;
  if (row.duplicate_of_stock_id != null) return false;
  if (row.stock_status !== "new" && row.stock_status !== "ready") return false;
  return true;
}
