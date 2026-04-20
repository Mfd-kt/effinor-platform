import type { AgentSimulatorLeadSession } from "@/features/cee-workflows/types/agent-simulator-lead-session";
import { isoToDatetimeLocal } from "@/lib/utils/datetime";

import type { LeadGenerationStockRow } from "../domain/stock-row";

function defaultCallbackDatetimeLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(10, 0, 0, 0);
  return isoToDatetimeLocal(d.toISOString());
}

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

/**
 * Préremplissage du simulateur agent depuis une fiche « Mes fiches » lead-generation.
 */
export function buildAgentSimulatorSessionFromLeadGenerationStock(
  stock: LeadGenerationStockRow,
): AgentSimulatorLeadSession {
  const primaryEmail =
    stock.enriched_email?.trim() || stock.email?.trim() || stock.normalized_email?.trim() || "";
  const phone = (stock.phone ?? stock.normalized_phone ?? "").trim();
  const company = stock.company_name?.trim() ?? "";
  const dm = stock.decision_maker_name?.trim();
  const contactName =
    dm && dm.length > 0 ? dm : company.length > 0 ? `Contact — ${company}` : "Contact";
  const notes = buildLeadGenerationStockContextNotes(stock);

  return {
    leadGenerationStockId: stock.id,
    companyName: company,
    civility: "",
    contactName,
    phone,
    callbackAt: defaultCallbackDatetimeLocal(),
    email: primaryEmail,
    address: stock.address?.trim() ?? "",
    city: stock.city?.trim() ?? "",
    postalCode: stock.postal_code?.trim() ?? "",
    notes,
  };
}
