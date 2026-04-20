import type { CommercialPipelineStatus } from "../domain/commercial-pipeline-status";

/**
 * Met à jour le statut pipeline après une activité commerciale.
 * Priorité : relance planifiée → follow_up ; sinon première action → contacted.
 */
export function nextCommercialPipelineStatusAfterActivity(input: {
  current: CommercialPipelineStatus;
  nextActionAt: string | null | undefined;
}): CommercialPipelineStatus {
  const { current } = input;
  if (current === "converted") {
    return "converted";
  }
  if (input.nextActionAt?.trim()) {
    return "follow_up";
  }
  if (current === "new") {
    return "contacted";
  }
  return current;
}
