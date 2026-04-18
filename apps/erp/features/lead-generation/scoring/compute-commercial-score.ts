import type { LeadGenerationCommercialPriority } from "../domain/statuses";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import type { CommercialScoringSettings } from "../settings/default-settings";

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export type CommercialScoreBreakdown = Record<string, number>;

const DEFAULT_PRIORITY_THRESHOLDS: CommercialScoringSettings = {
  priority_low_max: 29,
  priority_normal_min: 30,
  priority_high_min: 55,
  priority_critical_min: 75,
};

/**
 * Étape 12 — score commercial 0–100, règles explicites pondérées (pas d’IA).
 * Les doublons / rejets → score 0 et priorité basse.
 */
export function computeLeadGenerationCommercialScore(
  row: LeadGenerationStockRow,
  thresholds: CommercialScoringSettings = DEFAULT_PRIORITY_THRESHOLDS,
): {
  score: number;
  priority: LeadGenerationCommercialPriority;
  breakdown: CommercialScoreBreakdown;
} {
  const breakdown: CommercialScoreBreakdown = {};

  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
    breakdown.penalty_duplicate = -100;
    breakdown.total = 0;
    return { score: 0, priority: "low", breakdown };
  }

  if (row.stock_status === "rejected" || row.qualification_status === "rejected") {
    breakdown.penalty_rejected = -100;
    breakdown.total = 0;
    return { score: 0, priority: "low", breakdown };
  }

  let raw = 0;

  // A. Qualité de contact
  if (hasText(row.phone) || hasText(row.normalized_phone)) {
    breakdown.phone = 20;
    raw += 20;
  }
  if (hasText(row.email)) {
    breakdown.email_source = 15;
    raw += 15;
  }
  if (hasText(row.enriched_email)) {
    if (!hasText(row.email)) {
      breakdown.enriched_email = 8;
      raw += 8;
    } else {
      breakdown.enriched_email_complement = 5;
      raw += 5;
    }
  }
  if (hasText(row.website)) {
    breakdown.website_source = 10;
    raw += 10;
  }
  if (hasText(row.enriched_website)) {
    if (!hasText(row.website)) {
      breakdown.enriched_website = 5;
      raw += 5;
    } else {
      breakdown.enriched_website_complement = 3;
      raw += 3;
    }
  }

  // B. Confiance enrichissement
  if (row.enrichment_confidence === "high") {
    breakdown.enrichment_confidence = 25;
    raw += 25;
  } else if (row.enrichment_confidence === "medium") {
    breakdown.enrichment_confidence = 15;
    raw += 15;
  } else {
    breakdown.enrichment_confidence = 0;
  }

  // C. Qualité de fiche
  if (hasText(row.company_name) && row.company_name.trim().length >= 2) {
    breakdown.company_name = 5;
    raw += 5;
  }
  if (hasText(row.city)) {
    breakdown.city = 5;
    raw += 5;
  }
  if (hasText(row.category)) {
    breakdown.category = 5;
    raw += 5;
  }
  if (hasText(row.siret)) {
    breakdown.siret = 5;
    raw += 5;
  }

  // D. État métier
  switch (row.stock_status) {
    case "ready":
      breakdown.stock_status = 10;
      raw += 10;
      break;
    case "assigned":
      breakdown.stock_status = 8;
      raw += 8;
      break;
    case "in_progress":
      breakdown.stock_status = 6;
      raw += 6;
      break;
    case "new":
      breakdown.stock_status = 4;
      raw += 4;
      break;
    case "converted":
      breakdown.stock_status = 2;
      raw += 2;
      break;
    case "expired":
    case "archived":
      breakdown.stock_status = -5;
      raw -= 5;
      break;
    default:
      breakdown.stock_status = 0;
  }

  switch (row.qualification_status) {
    case "qualified":
      breakdown.qualification = 15;
      raw += 15;
      break;
    case "pending":
      breakdown.qualification = 6;
      raw += 6;
      break;
    default:
      breakdown.qualification = 0;
  }

  // E. Source (bonus modéré)
  if (row.source === "apify_google_maps") {
    breakdown.source_bonus = 3;
    raw += 3;
  }

  raw = Math.max(0, raw);
  const score = Math.min(100, raw);
  breakdown.total = score;

  let priority: LeadGenerationCommercialPriority;
  if (score >= thresholds.priority_critical_min) priority = "critical";
  else if (score >= thresholds.priority_high_min) priority = "high";
  else if (score >= thresholds.priority_normal_min) priority = "normal";
  else priority = "low";

  return { score, priority, breakdown };
}
