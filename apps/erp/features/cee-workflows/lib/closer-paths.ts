/** Onglets file closer (alignés sur `CloserWorkflowQueue`). */
export type CloserQueueTab = "pending" | "waitingSignature" | "followUps" | "signed" | "lost";

/** Query string : filtre fiche (`sheet` = id fiche CEE) + onglet optionnel. */
export function buildCloserQueuePath(
  sheetId?: string | null,
  opts?: { tab?: CloserQueueTab },
): string {
  const params = new URLSearchParams();
  if (sheetId && sheetId !== "all") params.set("sheet", sheetId);
  if (opts?.tab) params.set("tab", opts.tab);
  const query = params.toString();
  return query ? `/closer?${query}` : "/closer";
}
