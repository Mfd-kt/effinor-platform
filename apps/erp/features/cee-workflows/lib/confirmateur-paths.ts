/** Onglets file confirmateur (alignés sur `ConfirmateurWorkflowQueue`). */
export type ConfirmateurQueueTab = "pending" | "qualified" | "docsReady" | "recent";

/** Query string : filtre fiche (`sheet` = id fiche CEE) + onglet optionnel. */
export function buildConfirmateurQueuePath(
  sheetId?: string | null,
  opts?: { tab?: ConfirmateurQueueTab },
): string {
  const params = new URLSearchParams();
  if (sheetId && sheetId !== "all") params.set("sheet", sheetId);
  if (opts?.tab) params.set("tab", opts.tab);
  const query = params.toString();
  return query ? `/confirmateur?${query}` : "/confirmateur";
}

/** Page de travail d’un workflow ; préserve le filtre fiche dans l’URL. */
export function buildConfirmateurWorkflowPath(
  workflowId: string,
  sheetId: string | null | undefined,
): string {
  const base = `/confirmateur/${workflowId}`;
  const params = new URLSearchParams();
  if (sheetId && sheetId !== "all") params.set("sheet", sheetId);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
