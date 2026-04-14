-- Source « appel froid » (saisie manuelle terrain / prospection téléphonique).
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'cold_call';
