-- =============================================================================
-- Rôle « Quantificateur » lead generation + audit manuel (revue dédiée).
-- =============================================================================

INSERT INTO public.roles (code, label_fr)
VALUES ('lead_generation_quantifier', 'Quantificateur lead gen')
ON CONFLICT (code) DO UPDATE
SET label_fr = EXCLUDED.label_fr;

ALTER TABLE public.lead_generation_manual_reviews
  DROP CONSTRAINT IF EXISTS lead_generation_manual_reviews_review_type_check;

ALTER TABLE public.lead_generation_manual_reviews
  ADD CONSTRAINT lead_generation_manual_reviews_review_type_check CHECK (
    review_type IN (
      'duplicate_review',
      'dispatch_review',
      'enrichment_review',
      'stock_review',
      'quantifier_review'
    )
  );

ALTER TABLE public.lead_generation_manual_reviews
  DROP CONSTRAINT IF EXISTS lead_generation_manual_reviews_review_decision_check;

ALTER TABLE public.lead_generation_manual_reviews
  ADD CONSTRAINT lead_generation_manual_reviews_review_decision_check CHECK (
    review_decision IN (
      'confirm_duplicate',
      'restore_from_duplicate',
      'force_ready_now',
      'force_review',
      'force_do_not_dispatch',
      'confirm_verified_enrichment',
      'reject_enrichment_suggestions',
      'clear_enrichment_suggestions',
      'reopen_stock',
      'close_stock',
      'quantifier_qualify',
      'quantifier_out_of_target'
    )
  );

COMMENT ON COLUMN public.lead_generation_manual_reviews.review_type IS
  'Type de revue : quantifier_review = validation terrain avant diffusion commerciale.';
