import type { LeadGenerationStockRow } from "../domain/stock-row";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyOperationalLeadGenerationScope(q: any): any {
  return q.is("converted_lead_id", null);
}

export function isLeadGenerationStockOperational(row: Pick<LeadGenerationStockRow, "converted_lead_id">): boolean {
  return row.converted_lead_id == null;
}

export function leadGenerationConvertedStockMessage(): string {
  return "Cette fiche a déjà été transformée en fiche prospect CRM. Elle n’est plus exploitable dans le module lead gen.";
}

