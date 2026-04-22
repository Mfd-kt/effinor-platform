// TODO: Reimplement when a new public-site verification source replaces Firecrawl.

export type EnrichLeadGenerationDecisionMakerResult = {
  stockId: string;
  status: "completed" | "failed";
  skipped?: boolean;
  decision_maker_name?: string | null;
  decision_maker_role?: string | null;
  decision_maker_source?: string | null;
  decision_maker_confidence?: string | null;
  error?: string;
};

export async function enrichLeadGenerationDecisionMaker(input: {
  stockId: string;
}): Promise<EnrichLeadGenerationDecisionMakerResult> {
  return {
    stockId: input.stockId,
    status: "failed",
    error:
      "Identification automatique du décideur indisponible : la nouvelle source de scraping n'est pas encore branchée.",
  };
}
