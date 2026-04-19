import { createClient } from "@/lib/supabase/server";

import { lgTable } from "../lib/lg-db";

export type LeadGenerationClosingCockpitMetrics = {
  closingHighCount: number;
  withDecisionMakerCount: number;
  premiumReadyCount: number;
};

export async function getLeadGenerationClosingCockpitMetrics(): Promise<LeadGenerationClosingCockpitMetrics> {
  const supabase = await createClient();
  const stock = lgTable(supabase, "lead_generation_stock");

  const baseFilter = () =>
    stock
      .select("*", { count: "exact", head: true })
      .eq("stock_status", "ready")
      .is("duplicate_of_stock_id", null)
      .neq("qualification_status", "duplicate");

  const [rHigh, rDm, rPrem] = await Promise.all([
    baseFilter().eq("closing_readiness_status", "high"),
    baseFilter().not("decision_maker_name", "is", null),
    baseFilter().eq("lead_tier", "premium"),
  ]);

  if (rHigh.error) throw new Error(rHigh.error.message);
  if (rDm.error) throw new Error(rDm.error.message);
  if (rPrem.error) throw new Error(rPrem.error.message);

  return {
    closingHighCount: rHigh.count ?? 0,
    withDecisionMakerCount: rDm.count ?? 0,
    premiumReadyCount: rPrem.count ?? 0,
  };
}
