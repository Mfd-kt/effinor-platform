import { isEligibleForLeadGenerationEnrichment } from "../enrichment/enrich-lead-generation-stock";
import type { LeadGenerationStockRow } from "./stock-row";

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * La fiche peut encore gagner en qualité contact via l’enrichissement automatique (email / site).
 */
export function canBenefitFromContactImprovement(row: LeadGenerationStockRow): boolean {
  return isEligibleForLeadGenerationEnrichment(row).ok;
}

/**
 * Données contact suffisantes pour qu’une analyse commerciale + file puissent mener à une mise en relation réaliste
 * (aligné sur les garde-fous de la file de dispatch : email ou enrichi + site ou enrichi, ou confiance moyenne/forte).
 */
export function hasMeaningfulContactBasisForAssignment(row: LeadGenerationStockRow): boolean {
  const emailOk = hasText(row.email) || hasText(row.enriched_email);
  const siteOk = hasText(row.website) || hasText(row.enriched_website);
  const trustOk = row.enrichment_confidence === "medium" || row.enrichment_confidence === "high";
  return trustOk || (emailOk && siteOk);
}

/**
 * Fiche éligible au passage « améliorer & préparer » : stock actif, téléphone, pas exclus — et encore améliorable OU déjà exploitable pour classement.
 */
export function isCandidateForImproveAndPrepareStep(row: LeadGenerationStockRow): boolean {
  if (row.stock_status !== "ready") return false;
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") return false;
  if (row.qualification_status === "rejected") return false;
  if (!hasText(row.phone) && !hasText(row.normalized_phone)) return false;
  return true;
}

/**
 * Après compléments contact, la préparation (priorités + file) a un sens pour viser l’assignation.
 */
export function isReadyForMeaningfulPreparation(row: LeadGenerationStockRow): boolean {
  if (!isCandidateForImproveAndPrepareStep(row)) return false;
  if (canBenefitFromContactImprovement(row)) return false;
  return hasMeaningfulContactBasisForAssignment(row);
}
