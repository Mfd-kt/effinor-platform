import type { Json } from "./json";

/** Types de revue (CHECK SQL). */
export type LeadGenerationManualReviewType =
  | "duplicate_review"
  | "dispatch_review"
  | "enrichment_review"
  | "stock_review"
  | "quantifier_review"
  | "agent_return_review";

/** Décisions supportées (CHECK SQL). */
export type LeadGenerationManualReviewDecision =
  | "confirm_duplicate"
  | "restore_from_duplicate"
  | "force_ready_now"
  | "force_review"
  | "force_do_not_dispatch"
  | "confirm_verified_enrichment"
  | "reject_enrichment_suggestions"
  | "clear_enrichment_suggestions"
  | "reopen_stock"
  | "close_stock"
  | "quantifier_qualify"
  | "quantifier_out_of_target"
  | "commercial_return_to_quantification";

export type LeadGenerationManualReviewRow = {
  id: string;
  stock_id: string;
  reviewed_by_user_id: string;
  review_type: LeadGenerationManualReviewType;
  review_decision: LeadGenerationManualReviewDecision;
  review_notes: string | null;
  previous_snapshot: Json;
  new_snapshot: Json;
  created_at: string;
  updated_at: string;
};

export type ReviewLeadGenerationStockInput = {
  stockId: string;
  reviewType: LeadGenerationManualReviewType;
  reviewDecision: LeadGenerationManualReviewDecision;
  reviewNotes?: string | null;
  reviewedByUserId: string;
};

export type ReviewLeadGenerationStockResult = {
  reviewId: string;
  stockId: string;
};

/** Décisions autorisées par type (aligné CHECK SQL + logique métier). */
export const MANUAL_REVIEW_DECISIONS_BY_TYPE: Record<
  LeadGenerationManualReviewType,
  readonly LeadGenerationManualReviewDecision[]
> = {
  duplicate_review: ["confirm_duplicate", "restore_from_duplicate"],
  dispatch_review: ["force_ready_now", "force_review", "force_do_not_dispatch"],
  enrichment_review: [
    "confirm_verified_enrichment",
    "reject_enrichment_suggestions",
    "clear_enrichment_suggestions",
  ],
  stock_review: ["reopen_stock", "close_stock"],
  /** Hors cible quantificateur : action serveur dédiée (clôture d’attribution si besoin), pas via `reviewLeadGenerationStock`. */
  quantifier_review: ["quantifier_qualify"],
  /** Renvoi commercial → quantification : action serveur dédiée + insert audit. */
  agent_return_review: ["commercial_return_to_quantification"],
};

export function isManualReviewDecisionAllowedForType(
  reviewType: LeadGenerationManualReviewType,
  reviewDecision: LeadGenerationManualReviewDecision,
): boolean {
  return (MANUAL_REVIEW_DECISIONS_BY_TYPE[reviewType] as readonly string[]).includes(reviewDecision);
}
