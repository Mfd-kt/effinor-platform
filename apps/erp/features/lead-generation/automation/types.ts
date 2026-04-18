export const LEAD_GENERATION_AUTOMATION_TYPES = [
  "sync_pending_imports",
  "score_recent_stock",
  "evaluate_dispatch_queue_recent_stock",
  "evaluate_recycling_active_assignments",
] as const;

export type LeadGenerationAutomationType = (typeof LEAD_GENERATION_AUTOMATION_TYPES)[number];

export type LeadGenerationAutomationRunStatus = "running" | "completed" | "failed";
