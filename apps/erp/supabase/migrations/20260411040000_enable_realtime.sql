-- ═══════════════════════════════════════════════════════════════
-- Activer Supabase Realtime sur les tables du pipeline commercial
-- ═══════════════════════════════════════════════════════════════

-- Emails du lead (envoyés, reçus, supprimés)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_emails;

-- Tracking d'ouverture des emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_tracking;

-- Documents du lead (études, accords, documents reçus)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_documents;

-- Table leads elle-même (changements de statut, modifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Notes internes collaboratives
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_internal_notes;
