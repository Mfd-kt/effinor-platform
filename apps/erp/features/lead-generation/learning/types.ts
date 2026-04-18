export type LeadGenerationLearningCategory =
  | "source_performance"
  | "scoring_quality"
  | "enrichment_impact"
  | "operational_friction";

export type LeadGenerationLearningSeverity = "info" | "warning" | "success";

export type LeadGenerationLearningInsight = {
  category: LeadGenerationLearningCategory;
  title: string;
  severity: LeadGenerationLearningSeverity;
  summary: string;
  evidence: Record<string, unknown>;
  recommendation: string;
};

export type LearningStockSample = {
  source: string;
  commercial_score: number | null;
  commercial_priority: string | null;
  dispatch_queue_status: string | null;
  enrichment_confidence: string | null;
  email: string | null;
  website: string | null;
  enriched_email: string | null;
  enriched_domain: string | null;
  enriched_website: string | null;
  converted_lead_id: string | null;
};

export type LearningImportSample = {
  source: string;
  imported_count: number;
  accepted_count: number;
  duplicate_count: number;
  rejected_count: number;
  created_at: string;
};

export type LearningAssignmentSample = {
  id: string;
  recycle_reason: string | null;
};

export type LearningActivitySample = {
  assignment_id: string | null;
  outcome: string | null;
  next_action_at: string | null;
};
