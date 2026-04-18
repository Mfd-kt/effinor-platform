import type { LeadGenerationImportBatchStatus } from "./statuses";

/** Résumé d’exécution d’un import (côté serveur). */
export type LeadGenerationIngestBatchSummary = {
  import_batch_id: string;
  status: LeadGenerationImportBatchStatus;
  imported_count: number;
  accepted_count: number;
  duplicate_count: number;
  rejected_count: number;
  started_at: string | null;
  finished_at: string | null;
};

export type LeadGenerationIngestLineResult = {
  index: number;
  stock_id: string | null;
  outcome: "accepted" | "duplicate" | "rejected_no_phone";
  duplicate_of_stock_id?: string;
};

export type LeadGenerationIngestResult =
  | {
      ok: true;
      summary: LeadGenerationIngestBatchSummary;
      lines: LeadGenerationIngestLineResult[];
    }
  | {
      ok: false;
      message: string;
      summary?: LeadGenerationIngestBatchSummary;
    };
