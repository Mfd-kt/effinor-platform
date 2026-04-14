-- Ajouter le statut "dossier_sent" à l'enum lead_status
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'dossier_sent' AFTER 'qualified';
