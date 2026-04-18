import { buildVerifiedScrapeUrls } from "../firecrawl/verified-scrape-urls";
import type { LeadGenerationStockRow } from "../domain/stock-row";

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isVerifiedOrStrongConfidence(c: string): boolean {
  return c === "medium" || c === "high";
}

/** Email « fiable » dans enriched_* : présent avec confiance autre que pure suggestion low. */
function hasReliableEnrichedEmail(row: LeadGenerationStockRow): boolean {
  return hasText(row.enriched_email) && isVerifiedOrStrongConfidence(row.enrichment_confidence);
}

function hasReliableEnrichedWebsite(row: LeadGenerationStockRow): boolean {
  return hasText(row.enriched_website) && isVerifiedOrStrongConfidence(row.enrichment_confidence);
}

/**
 * Étape 11 — éligibilité Firecrawl : fiche prête, pas doublon/rejet, pas en cours,
 * pas déjà au niveau `high`, et besoin réel de vérification (données manquantes ou seulement suggestion low).
 */
export function isEligibleForVerifiedLeadGenerationEnrichment(
  row: LeadGenerationStockRow,
): { ok: true } | { ok: false; reason: string } {
  if (row.stock_status === "rejected" || row.qualification_status === "rejected") {
    return { ok: false, reason: "Fiche rejetée : vérification non applicable." };
  }
  if (row.stock_status !== "ready") {
    return { ok: false, reason: "La vérification site n’est disponible que pour les fiches au statut « prêt »." };
  }
  if (!hasText(row.phone)) {
    return { ok: false, reason: "Téléphone requis." };
  }
  if (!hasText(row.company_name)) {
    return { ok: false, reason: "Nom d’entreprise requis." };
  }
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
    return { ok: false, reason: "Doublon : vérification non applicable." };
  }
  if (row.enrichment_status === "in_progress") {
    return { ok: false, reason: "Un enrichissement est déjà en cours." };
  }

  if (row.enrichment_confidence === "high") {
    return { ok: false, reason: "Niveau de confiance déjà maximal : pas de nouvelle vérification nécessaire." };
  }

  const needEmail =
    !hasText(row.email) && !hasReliableEnrichedEmail(row);
  const needWebsite =
    !hasText(row.website) && !hasReliableEnrichedWebsite(row);
  const onlyLowSuggestion = row.enrichment_confidence === "low";

  if (!needEmail && !needWebsite && !onlyLowSuggestion) {
    return {
      ok: false,
      reason: "Aucun besoin de vérification : email et site sources ou suggestions fiables déjà présents.",
    };
  }

  if (buildVerifiedScrapeUrls(row).length === 0) {
    return {
      ok: false,
      reason: "Aucune URL publique à analyser : renseignez un site ou un domaine exploitable.",
    };
  }

  return { ok: true };
}
