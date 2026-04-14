-- =============================================================================
-- Correctif GoTrue : NULL sur les colonnes token dans auth.users
-- Symptôme à la connexion : AuthApiError "Database error querying schema"
-- Détail côté logs : confirmation_token : converting NULL to string is unsupported
-- Réf. : https://github.com/supabase/auth/issues/1940
-- =============================================================================
-- Exécuter une fois dans le SQL Editor du projet (comptes déjà créés sans ces champs).
-- =============================================================================

UPDATE auth.users
SET
  confirmation_token = coalesce(confirmation_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  recovery_token = coalesce(recovery_token, '')
WHERE confirmation_token IS NULL
   OR email_change IS NULL
   OR email_change_token_new IS NULL
   OR recovery_token IS NULL;
