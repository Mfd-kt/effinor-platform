-- Permet de supprimer un lead (table editor Supabase ou DELETE applicatif) sans erreur FK :
-- les visites techniques rattachées sont supprimées en cascade (comportement aligné sur
-- lead_sheet_workflows, lead_emails, lead_internal_notes, etc.).

ALTER TABLE public.technical_visits
  DROP CONSTRAINT IF EXISTS technical_visits_lead_id_fkey;

ALTER TABLE public.technical_visits
  ADD CONSTRAINT technical_visits_lead_id_fkey
    FOREIGN KEY (lead_id)
    REFERENCES public.leads (id)
    ON DELETE CASCADE;
