/**
 * Codes source persistés (`lead_generation_import_batches.source`, `lead_generation_stock.source`).
 * Étendre au fil des connecteurs (Sirene, partenaires, etc.).
 */
export type LeadGenerationImportSourceCode =
  | "apify_google_maps"
  | "csv_manual"
  | "leboncoin_immobilier"
  | "pap"
  | "pap_location"
  | (string & {});

export type LeadGenerationImportSourceDefinition = {
  code: LeadGenerationImportSourceCode;
  /** Libellé UI (liste imports, filtres). */
  label: string;
};
