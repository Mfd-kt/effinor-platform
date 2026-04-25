-- Migration: rôle marketing_manager
-- Date: 2026-04-25
-- Description: ajoute le rôle "Responsable Marketing" pour gérer
--              le module Marketing (blog + réalisations) dans l'ERP.
-- Note: la table public.roles a la colonne label_fr (cf. 20260331181000_initial_schema.sql),
--       pas "label". Pattern UPSERT identique à 20260403140000_rbac_role_admin.sql.

BEGIN;

INSERT INTO public.roles (code, label_fr)
VALUES ('marketing_manager', 'Responsable Marketing')
ON CONFLICT (code) DO UPDATE
SET label_fr = EXCLUDED.label_fr;

COMMIT;
