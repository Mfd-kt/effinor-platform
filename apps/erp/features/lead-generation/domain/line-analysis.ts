import type { LeadGenerationQualificationStatus } from "./statuses";

/** Résultat d’analyse d’une ligne avant / pendant ingestion (sans persistance). */
export type LeadGenerationLineAnalysisKind = "accepted" | "rejected" | "duplicate";

export type LeadGenerationLineAnalysisBase = {
  kind: LeadGenerationLineAnalysisKind;
};

export type LeadGenerationLineAnalysisAccepted = LeadGenerationLineAnalysisBase & {
  kind: "accepted";
  qualification_status: Extract<LeadGenerationQualificationStatus, "qualified">;
};

export type LeadGenerationLineAnalysisRejectedNoPhone = LeadGenerationLineAnalysisBase & {
  kind: "rejected";
  reason: "no_phone";
  qualification_status: Extract<LeadGenerationQualificationStatus, "rejected">;
};

export type LeadGenerationLineAnalysisDuplicate = LeadGenerationLineAnalysisBase & {
  kind: "duplicate";
  duplicate_of_stock_id: string;
  qualification_status: Extract<LeadGenerationQualificationStatus, "duplicate">;
};

export type LeadGenerationLineAnalysis =
  | LeadGenerationLineAnalysisAccepted
  | LeadGenerationLineAnalysisRejectedNoPhone
  | LeadGenerationLineAnalysisDuplicate;
