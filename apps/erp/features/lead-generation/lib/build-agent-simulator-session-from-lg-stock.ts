// TODO: cee-workflows retiré — le type `AgentSimulatorLeadSession` provenait de
// features/cee-workflows. Les utilitaires sont conservés mais le builder retourne
// un objet vide en attendant le nouveau pipeline simulation/agent.

import type { LeadGenerationStockRow } from "../domain/stock-row";

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/** Contexte collecté sur la fiche stock (simulateur : champ notes + traçabilité). */
export function buildLeadGenerationStockContextNotes(stock: LeadGenerationStockRow): string {
  const lines: string[] = [];

  if (hasText(stock.decision_maker_role)) {
    lines.push(`Fonction : ${stock.decision_maker_role!.trim()}`);
  }
  if (hasText(stock.linkedin_url)) {
    lines.push(`LinkedIn : ${stock.linkedin_url!.trim()}`);
  }
  const site = stock.enriched_website?.trim() || stock.website?.trim();
  if (site) {
    lines.push(`Site : ${site}`);
  }
  if (hasText(stock.siret)) {
    lines.push(`SIRET : ${stock.siret!.trim()}`);
  }
  if (hasText(stock.category)) {
    const sub = hasText(stock.sub_category) ? ` / ${stock.sub_category!.trim()}` : "";
    lines.push(`Activité : ${stock.category!.trim()}${sub}`);
  }
  if (hasText(stock.enrichment_source)) {
    const conf = stock.enrichment_confidence ?? "";
    lines.push(`Enrichissement : ${stock.enrichment_source}${conf ? ` (${conf})` : ""}`);
  }
  if (stock.headcount_range?.trim()) {
    lines.push(`Effectifs : ${stock.headcount_range.trim()}`);
  }

  return lines.join("\n");
}

export function buildAgentSimulatorSessionFromLeadGenerationStock(
  _stock: LeadGenerationStockRow,
): any {
  return {};
}
