import type { Json } from "../domain/json";
import type { LeadGenerationGptResearchInput } from "../domain/lead-generation-gpt-research";
import type { LeadGenerationImportBatchRow, LeadGenerationStockRow } from "../domain/stock-row";
import { buildLeadGenerationStreetViewModel } from "./lead-generation-street-view";

function trimOrNull(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

/**
 * Extrait un extrait léger du payload brut (Apify Maps, etc.) pour le contexte GPT, sans tout envoyer.
 */
function excerptRawPayload(raw: Json | null | undefined): Json | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const r = raw as Record<string, unknown>;
  const apify = r.apify_google_maps_item ?? r.extra_payload;
  if (apify && typeof apify === "object" && !Array.isArray(apify)) {
    const o = apify as Record<string, unknown>;
    return {
      title: o.title,
      categoryName: o.categoryName,
      website: o.website,
      url: o.url,
    } as Json;
  }
  return null;
}

/**
 * Données d’entrée pour la recherche GPT + Pappers depuis la fiche stock (quantification).
 */
export function buildLeadGenerationGptResearchInput(
  stock: LeadGenerationStockRow,
  importBatch: LeadGenerationImportBatchRow | null,
): LeadGenerationGptResearchInput {
  const maps = buildLeadGenerationStreetViewModel(stock);
  const embedSrc = maps.embedSrc?.trim() || null;

  return {
    company_name: (stock.company_name ?? "").trim(),
    phone: trimOrNull(stock.phone),
    normalized_phone: trimOrNull(stock.normalized_phone),
    address: trimOrNull(stock.address),
    postal_code: trimOrNull(stock.postal_code),
    city: trimOrNull(stock.city),
    website: trimOrNull(stock.website),
    enriched_website: trimOrNull(stock.enriched_website),
    normalized_domain: trimOrNull(stock.normalized_domain),
    maps_url: maps.openMapsUrl.length > 0 ? maps.openMapsUrl : null,
    street_view_url: embedSrc,
    cee_sheet_id: trimOrNull(importBatch?.cee_sheet_id ?? null),
    cee_sheet_code: trimOrNull(importBatch?.cee_sheet_code ?? null),
    decision_maker_name: trimOrNull(stock.decision_maker_name),
    decision_maker_role: trimOrNull(stock.decision_maker_role),
    email: trimOrNull(stock.email),
    enriched_email: trimOrNull(stock.enriched_email),
    siret: trimOrNull(stock.siret),
    category: trimOrNull(stock.category),
    sub_category: trimOrNull(stock.sub_category),
    raw_payload_excerpt: excerptRawPayload(stock.raw_payload),
  };
}
