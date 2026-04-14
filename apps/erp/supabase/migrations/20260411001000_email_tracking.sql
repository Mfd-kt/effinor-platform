-- Email open tracking
CREATE TABLE IF NOT EXISTS email_tracking (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid REFERENCES leads(id) ON DELETE SET NULL,
  recipient     text NOT NULL,
  subject       text,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  opened_at     timestamptz,
  open_count    integer NOT NULL DEFAULT 0,
  last_opened_at timestamptz,
  user_agent    text,
  ip_address    text,
  created_by    uuid
);

CREATE INDEX idx_email_tracking_lead ON email_tracking(lead_id);
CREATE INDEX idx_email_tracking_recipient ON email_tracking(recipient);

ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read email tracking"
  ON email_tracking FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert email tracking"
  ON email_tracking FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role can update email tracking"
  ON email_tracking FOR UPDATE USING (true) WITH CHECK (true);
