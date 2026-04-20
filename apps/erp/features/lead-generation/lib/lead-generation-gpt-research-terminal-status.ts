/** Statuts DB où une recherche a produit un payload exploitable (avec ou sans avertissements). */
export function isLeadGenerationGptResearchSuccessful(status: string | null | undefined): boolean {
  return status === "completed" || status === "completed_with_warning";
}
