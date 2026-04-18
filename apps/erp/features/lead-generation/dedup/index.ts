export {
  computeLeadGenerationDuplicateMatch,
  matchingCompanyKeyFromStock,
  type LeadGenerationDuplicateMatchReason,
  type LeadGenerationDuplicateMatchResult,
} from "./compute-duplicate-match";
export { findAdvancedDuplicateLeadGenerationStock, type AdvancedDuplicateFindResult } from "./find-advanced-duplicate-lead-generation-stock";
export { normalizeCompanyNameForMatching, areCompanyNamesSimilarForDedup } from "./normalize-company-name-for-matching";
export { normalizePostalCodeForDedup } from "./normalize-postal-for-dedup";
export { formatDuplicateMatchReasonsForDisplay } from "./duplicate-match-labels";
