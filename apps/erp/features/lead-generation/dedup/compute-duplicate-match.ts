import type { LeadGenerationPreparedStockRow } from "../domain/prepared-row";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import { normalizePostalCodeForDedup } from "./normalize-postal-for-dedup";
import { areCompanyNamesSimilarForDedup, normalizeCompanyNameForMatching } from "./normalize-company-name-for-matching";

export type LeadGenerationDuplicateMatchReason =
  | "exact_siret"
  | "exact_email"
  | "exact_phone_and_similar_name"
  | "exact_domain_and_similar_name"
  | "similar_name_same_city_and_postal"
  | "similar_name_and_same_city"
  | "similar_name_and_same_postal";

export type LeadGenerationDuplicateMatchResult = {
  isDuplicate: boolean;
  matchScore: number;
  matchReasons: LeadGenerationDuplicateMatchReason[];
};

function normCity(c: string | null | undefined): string | null {
  if (c == null || !String(c).trim()) {
    return null;
  }
  return String(c)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Compare une fiche stock existante avec un candidat à l’ingestion.
 * Règles prudentes : signaux faibles seuls (téléphone / domaine sans nom proche) ne suffisent pas.
 */
export function computeLeadGenerationDuplicateMatch(
  existing: LeadGenerationStockRow,
  candidate: LeadGenerationPreparedStockRow,
): LeadGenerationDuplicateMatchResult {
  const reasons: LeadGenerationDuplicateMatchReason[] = [];
  let score = 0;

  const siretE = existing.siret?.replace(/\s/g, "") ?? null;
  const siretC = candidate.normalized_siret?.replace(/\s/g, "") ?? null;
  if (siretE && siretC && siretE === siretC) {
    return { isDuplicate: true, matchScore: 100, matchReasons: ["exact_siret"] };
  }

  if (
    existing.normalized_email &&
    candidate.normalized_email &&
    existing.normalized_email === candidate.normalized_email
  ) {
    return { isDuplicate: true, matchScore: 96, matchReasons: ["exact_email"] };
  }

  const phoneMatch =
    !!existing.normalized_phone &&
    !!candidate.normalized_phone &&
    existing.normalized_phone === candidate.normalized_phone;
  const nameSimilar = areCompanyNamesSimilarForDedup(existing.company_name, candidate.company_name);

  if (phoneMatch && nameSimilar) {
    reasons.push("exact_phone_and_similar_name");
    score = 88;
    return { isDuplicate: true, matchScore: score, matchReasons: reasons };
  }

  const domainMatch =
    !!existing.normalized_domain &&
    !!candidate.normalized_domain &&
    existing.normalized_domain === candidate.normalized_domain;
  if (domainMatch && nameSimilar) {
    reasons.push("exact_domain_and_similar_name");
    score = 84;
    return { isDuplicate: true, matchScore: score, matchReasons: reasons };
  }

  const cityE = normCity(existing.city);
  const cityC = normCity(candidate.city);
  const cityOk = cityE && cityC && cityE === cityC;

  const postE = normalizePostalCodeForDedup(existing.postal_code);
  const postC = normalizePostalCodeForDedup(candidate.postal_code);
  const postalOk = postE && postC && postE === postC;

  if (nameSimilar && cityOk && postalOk) {
    return {
      isDuplicate: true,
      matchScore: 74,
      matchReasons: ["similar_name_same_city_and_postal"],
    };
  }

  if (nameSimilar && cityOk) {
    return {
      isDuplicate: true,
      matchScore: 68,
      matchReasons: ["similar_name_and_same_city"],
    };
  }

  if (nameSimilar && postalOk) {
    return {
      isDuplicate: true,
      matchScore: 64,
      matchReasons: ["similar_name_and_same_postal"],
    };
  }

  return { isDuplicate: false, matchScore: 0, matchReasons: [] };
}

/** Clé de matching pour une ligne stock existante (alignée sur le candidat importé). */
export function matchingCompanyKeyFromStock(row: LeadGenerationStockRow): string | null {
  return normalizeCompanyNameForMatching(row.company_name);
}
