-- Étape 20 — validation humaine assistée (audit + marqueurs sur le stock)

-- -----------------------------------------------------------------------------
-- Marqueurs de revue sur la fiche stock
-- -----------------------------------------------------------------------------
ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS manual_override_status text,
  ADD COLUMN IF NOT EXISTS manual_override_reason text,
  ADD COLUMN IF NOT EXISTS manually_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS manually_reviewed_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.lead_generation_stock.manual_override_status IS
  'Résumé court de la dernière action de validation manuelle (étape 20).';

COMMENT ON COLUMN public.lead_generation_stock.manual_override_reason IS
  'Motif ou libellé associé à la dernière revue manuelle.';

COMMENT ON COLUMN public.lead_generation_stock.manually_reviewed_at IS
  'Horodatage de la dernière revue manuelle enregistrée.';

COMMENT ON COLUMN public.lead_generation_stock.manually_reviewed_by_user_id IS
  'Auteur de la dernière revue manuelle.';

-- -----------------------------------------------------------------------------
-- Journal des revues manuelles
-- -----------------------------------------------------------------------------
CREATE TABLE public.lead_generation_manual_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.lead_generation_stock (id) ON DELETE CASCADE,
  reviewed_by_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  review_type text NOT NULL,
  review_decision text NOT NULL,
  review_notes text,
  previous_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_manual_reviews_review_type_check CHECK (
    review_type IN (
      'duplicate_review',
      'dispatch_review',
      'enrichment_review',
      'stock_review'
    )
  ),
  CONSTRAINT lead_generation_manual_reviews_review_decision_check CHECK (
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
      'close_stock'
    )
  )
);

COMMENT ON TABLE public.lead_generation_manual_reviews IS
  'Journal des validations / corrections manuelles sur le stock lead generation (étape 20).';

CREATE INDEX idx_lead_generation_manual_reviews_stock_id ON public.lead_generation_manual_reviews (stock_id);

CREATE INDEX idx_lead_generation_manual_reviews_reviewed_by ON public.lead_generation_manual_reviews (reviewed_by_user_id);

CREATE INDEX idx_lead_generation_manual_reviews_review_type ON public.lead_generation_manual_reviews (review_type);

CREATE INDEX idx_lead_generation_manual_reviews_created_at_desc ON public.lead_generation_manual_reviews (created_at DESC);

DROP TRIGGER IF EXISTS set_lead_generation_manual_reviews_updated_at ON public.lead_generation_manual_reviews;
CREATE TRIGGER set_lead_generation_manual_reviews_updated_at
  BEFORE UPDATE ON public.lead_generation_manual_reviews
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.lead_generation_manual_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_manual_reviews_all_active"
  ON public.lead_generation_manual_reviews
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
