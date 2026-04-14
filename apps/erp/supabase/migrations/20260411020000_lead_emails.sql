-- Table unifiée pour tous les emails liés à un lead (envoyés + reçus)
CREATE TABLE IF NOT EXISTS lead_emails (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid REFERENCES leads(id) ON DELETE CASCADE,
  direction     text NOT NULL CHECK (direction IN ('sent', 'received')),
  from_email    text NOT NULL,
  to_email      text NOT NULL,
  subject       text,
  html_body     text,
  text_body     text,
  gmail_message_id text,
  email_date    timestamptz NOT NULL DEFAULT now(),
  tracking_id   uuid REFERENCES email_tracking(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_emails_lead ON lead_emails(lead_id);
CREATE INDEX idx_lead_emails_direction ON lead_emails(lead_id, direction);
CREATE UNIQUE INDEX idx_lead_emails_gmail_id ON lead_emails(gmail_message_id) WHERE gmail_message_id IS NOT NULL;

ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lead emails"
  ON lead_emails FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert lead emails"
  ON lead_emails FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role full access lead emails"
  ON lead_emails FOR ALL USING (true) WITH CHECK (true);
