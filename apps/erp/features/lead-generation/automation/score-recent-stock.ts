import { recalculateReadyLeadGenerationCommercialScoreQuick } from "../scoring/recalculate-lead-generation-commercial-score-batch";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

const LIMIT = 50;

export async function runScoreRecentStockJob() {
  const { settings } = await getLeadGenerationSettings();
  return recalculateReadyLeadGenerationCommercialScoreQuick({
    limit: settings.automationLimits.score_recent_stock_limit ?? LIMIT,
  });
}
