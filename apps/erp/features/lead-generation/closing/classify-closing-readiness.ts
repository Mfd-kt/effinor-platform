import type { LeadGenerationClosingReadinessStatus } from "../domain/stock-row";

export function classifyClosingReadinessStatus(score: number): LeadGenerationClosingReadinessStatus {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
