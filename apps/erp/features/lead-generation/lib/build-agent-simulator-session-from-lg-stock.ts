import type { AgentSimulatorLeadSession } from "@/features/cee-workflows/types/agent-simulator-lead-session";
import { isoToDatetimeLocal } from "@/lib/utils/datetime";

import type { LeadGenerationStockRow } from "../domain/stock-row";

function defaultCallbackDatetimeLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(10, 0, 0, 0);
  return isoToDatetimeLocal(d.toISOString());
}

/**
 * Préremplissage du simulateur agent depuis une fiche « Mes fiches » lead-generation.
 */
export function buildAgentSimulatorSessionFromLeadGenerationStock(
  stock: LeadGenerationStockRow,
): AgentSimulatorLeadSession {
  const primaryEmail = stock.email?.trim() || stock.enriched_email?.trim() || "";
  const phone = (stock.phone ?? stock.normalized_phone ?? "").trim();
  const company = stock.company_name?.trim() ?? "";

  return {
    leadGenerationStockId: stock.id,
    companyName: company,
    civility: "",
    contactName: company.length > 0 ? `Contact — ${company}` : "Contact",
    phone,
    callbackAt: defaultCallbackDatetimeLocal(),
    email: primaryEmail,
    address: stock.address?.trim() ?? "",
    city: stock.city?.trim() ?? "",
    postalCode: stock.postal_code?.trim() ?? "",
    notes: "",
  };
}
