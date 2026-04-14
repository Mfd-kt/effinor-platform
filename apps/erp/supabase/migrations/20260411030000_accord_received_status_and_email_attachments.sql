-- Nouveau statut "accord reçu" dans le pipeline commercial
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'accord_received' AFTER 'dossier_sent';

-- Colonne pour stocker les métadonnées des pièces jointes sur lead_emails
ALTER TABLE public.lead_emails
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Colonne pour stocker l'analyse IA de l'email (signaux commerciaux)
ALTER TABLE public.lead_emails
  ADD COLUMN IF NOT EXISTS ai_analysis jsonb;

-- Politique service_role pour insert dans lead_documents (nécessaire pour sync automatique)
DROP POLICY IF EXISTS lead_documents_service_insert ON public.lead_documents;
CREATE POLICY lead_documents_service_insert
  ON public.lead_documents
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS lead_documents_service_select ON public.lead_documents;
CREATE POLICY lead_documents_service_select
  ON public.lead_documents
  FOR SELECT TO service_role
  USING (true);
