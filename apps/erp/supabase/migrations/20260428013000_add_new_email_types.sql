-- Migration : extension contrainte email_type pour les nouveaux templates email
-- Ajoute 6 nouveaux types liés à la refonte B2C du système email

ALTER TABLE email_events
  DROP CONSTRAINT IF EXISTS email_events_email_type_check;

ALTER TABLE email_events
  ADD CONSTRAINT email_events_email_type_check
  CHECK (email_type = ANY (ARRAY[
    'INTERNAL_CREDENTIALS'::text,
    'LEAD_FIRST_CONTACT'::text,
    'STUDY_SENT'::text,
    'CALLBACK_INITIAL'::text,
    'CALLBACK_FOLLOWUP'::text,
    'QUALIFIED_PROSPECT'::text,
    'LEAD_FIRST_CONTACT_COLD_CALL'::text,
    'LEAD_FIRST_CONTACT_SITE_WEB'::text,
    'LEAD_FIRST_CONTACT_LANDING_PAC'::text,
    'LEAD_FIRST_CONTACT_LANDING_RENO'::text,
    'DOCS_TO_SIGN'::text,
    'AUDIT_RDV_CONFIRMED'::text
  ]));

COMMENT ON CONSTRAINT email_events_email_type_check ON email_events
  IS 'Types valides pour la colonne email_type — mis à jour le 28/04/2026 lors de la refonte email B2C';
