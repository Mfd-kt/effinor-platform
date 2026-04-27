import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";

/**
 * Met à jour le statut pipeline après une activité commerciale.
 * Priorité : date de rappel → follow_up ; issue « rappel demandé » → follow_up ; sinon 1ʳᵉ action → contacted.
 */
export function nextCommercialPipelineStatusAfterActivity(input: {
  current: CommercialPipelineStatus;
  nextActionAt: string | null | undefined;
  /** Issue métier (ex. rappel demandé = file « à rappeler » / suivi). */
  activityOutcome: string | null | undefined;
}): CommercialPipelineStatus {
  const { current, activityOutcome } = input;
  if (current === "converted") {
    return "converted";
  }
  if (input.nextActionAt?.trim()) {
    return "follow_up";
  }
  const o = (activityOutcome ?? "").trim();
  if (o === "called_callback_requested") {
    return "follow_up";
  }
  if (current === "new") {
    return "contacted";
  }
  return current;
}
