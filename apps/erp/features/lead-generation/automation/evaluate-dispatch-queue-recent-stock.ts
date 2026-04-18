import { evaluateReadyLeadGenerationDispatchQueueQuick } from "../queue/evaluate-dispatch-queue";
import { getLeadGenerationSettings } from "../settings/get-lead-generation-settings";

const LIMIT = 50;

export async function runEvaluateDispatchQueueRecentStockJob() {
  const { settings } = await getLeadGenerationSettings();
  return evaluateReadyLeadGenerationDispatchQueueQuick({
    limit: settings.automationLimits.evaluate_dispatch_queue_limit ?? LIMIT,
  });
}
