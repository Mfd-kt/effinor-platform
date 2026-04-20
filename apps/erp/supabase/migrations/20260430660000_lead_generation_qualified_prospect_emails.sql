-- E-mails de prospection B2B après qualification quantificateur (fiche stock).

CREATE TABLE public.lead_generation_qualified_prospect_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL REFERENCES public.lead_generation_stock (id) ON DELETE CASCADE,
  manual_review_id uuid NOT NULL REFERENCES public.lead_generation_manual_reviews (id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  used_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text,
  generation_source text NOT NULL,
  pipeline_status text NOT NULL,
  skip_reason text,
  smtp_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_generation_qualified_prospect_emails_manual_review_unique UNIQUE (manual_review_id),
  CONSTRAINT lead_generation_qualified_prospect_emails_generation_source_check CHECK (
    generation_source IN ('openai', 'fallback', 'none')
  ),
  CONSTRAINT lead_generation_qualified_prospect_emails_pipeline_status_check CHECK (
    pipeline_status IN (
      'skipped',
      'validation_failed',
      'sent',
      'failed',
      'openai_failed'
    )
  ),
  CONSTRAINT lead_generation_qualified_prospect_emails_confidence_check CHECK (
    confidence IS NULL OR confidence IN ('high', 'medium', 'low')
  )
);

COMMENT ON TABLE public.lead_generation_qualified_prospect_emails IS
  'Journal des e-mails de prospection générés après qualification quantificateur (un enregistrement par revue).';

CREATE INDEX idx_lead_generation_qualified_prospect_emails_stock_id
  ON public.lead_generation_qualified_prospect_emails (stock_id);

CREATE INDEX idx_lead_generation_qualified_prospect_emails_created_at_desc
  ON public.lead_generation_qualified_prospect_emails (created_at DESC);

DROP TRIGGER IF EXISTS set_lead_generation_qualified_prospect_emails_updated_at
  ON public.lead_generation_qualified_prospect_emails;
CREATE TRIGGER set_lead_generation_qualified_prospect_emails_updated_at
  BEFORE UPDATE ON public.lead_generation_qualified_prospect_emails
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.lead_generation_qualified_prospect_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_generation_qualified_prospect_emails_all_active"
  ON public.lead_generation_qualified_prospect_emails
  FOR ALL
  TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());
