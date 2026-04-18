import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

import { computeEnrichmentInsights } from "./compute-enrichment-insights";
import { computeRecyclingInsights } from "./compute-recycling-insights";
import { computeScoringQualityInsights } from "./compute-scoring-quality-insights";
import { computeSourcePerformanceInsights } from "./compute-source-performance-insights";
import type {
  LeadGenerationLearningInsight,
  LearningActivitySample,
  LearningAssignmentSample,
  LearningImportSample,
  LearningStockSample,
} from "./types";

export type LeadGenerationLearningInsightsResult = {
  generatedAt: string;
  insights: LeadGenerationLearningInsight[];
  counts: {
    imports: number;
    stock: number;
    assignments: number;
    activities: number;
  };
};

export async function getLeadGenerationLearningInsights(): Promise<LeadGenerationLearningInsightsResult> {
  const supabase = await createClient();
  const importsT = lgTable(supabase, "lead_generation_import_batches");
  const stockT = lgTable(supabase, "lead_generation_stock");
  const assignmentsT = lgTable(supabase, "lead_generation_assignments");
  const activitiesT = lgTable(supabase, "lead_generation_assignment_activities");

  const [{ data: imports, error: iErr }, { data: stock, error: sErr }, { data: assignments, error: aErr }, { data: activities, error: actErr }] =
    await Promise.all([
      importsT.select("source, imported_count, accepted_count, duplicate_count, rejected_count, created_at"),
      stockT.select(
        "source, commercial_score, commercial_priority, dispatch_queue_status, enrichment_confidence, email, website, enriched_email, enriched_domain, enriched_website, converted_lead_id",
      ),
      assignmentsT.select("id, recycle_reason"),
      activitiesT.select("assignment_id, outcome, next_action_at"),
    ]);

  if (iErr) throw new Error(`Learning loop imports: ${iErr.message}`);
  if (sErr) throw new Error(`Learning loop stock: ${sErr.message}`);
  if (aErr) throw new Error(`Learning loop assignments: ${aErr.message}`);
  if (actErr) throw new Error(`Learning loop activities: ${actErr.message}`);

  const importsRows = (imports ?? []) as LearningImportSample[];
  const stockRows = (stock ?? []) as LearningStockSample[];
  const assignmentRows = (assignments ?? []) as LearningAssignmentSample[];
  const activityRows = (activities ?? []) as LearningActivitySample[];

  const insights: LeadGenerationLearningInsight[] = [
    ...computeSourcePerformanceInsights({ imports: importsRows, stock: stockRows }),
    ...computeScoringQualityInsights(stockRows),
    ...computeEnrichmentInsights(stockRows),
    ...computeRecyclingInsights({ assignments: assignmentRows, activities: activityRows }),
  ];

  return {
    generatedAt: new Date().toISOString(),
    insights,
    counts: {
      imports: importsRows.length,
      stock: stockRows.length,
      assignments: assignmentRows.length,
      activities: activityRows.length,
    },
  };
}
