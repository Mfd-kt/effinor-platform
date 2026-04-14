-- ============================================
-- Migration: Nettoyage des colonnes de rôle redondantes dans utilisateurs
-- ============================================
-- Problème: La table utilisateurs contient 3 colonnes pour les rôles :
--   - role (TEXT) - ancienne colonne
--   - role_id (UUID FK) - clé étrangère vers roles.id ✅ (à garder)
--   - role_slug (TEXT) - duplique roles.slug ❌ (redondant)
--
-- Solution: Standardiser sur role_id uniquement et accéder au slug via la relation
-- ============================================

-- ÉTAPE 1: Créer une table de backup pour pouvoir restaurer si nécessaire
CREATE TABLE IF NOT EXISTS public.utilisateurs_role_backup AS
SELECT 
  id,
  role,
  role_slug,
  role_id,
  created_at as backup_created_at
FROM public.utilisateurs;

COMMENT ON TABLE public.utilisateurs_role_backup IS 'Backup des colonnes role et role_slug avant suppression - Créé le 2025-12-02';

-- ÉTAPE 2: Vérifier et corriger les incohérences dans role_id
-- Si role_id est NULL mais role_slug existe, trouver le role_id correspondant
UPDATE public.utilisateurs u
SET role_id = r.id
FROM public.roles r
WHERE u.role_id IS NULL
  AND u.role_slug IS NOT NULL
  AND r.slug = u.role_slug;

-- Si role_id est NULL mais role existe (ancienne colonne), essayer de trouver via role_slug d'abord
UPDATE public.utilisateurs u
SET role_id = r.id
FROM public.roles r
WHERE u.role_id IS NULL
  AND u.role IS NOT NULL
  AND u.role_slug IS NOT NULL
  AND r.slug = u.role_slug;

-- Si role_id est toujours NULL, essayer de trouver via role (ancienne colonne) directement
UPDATE public.utilisateurs u
SET role_id = r.id
FROM public.roles r
WHERE u.role_id IS NULL
  AND u.role IS NOT NULL
  AND r.slug = u.role;

-- Si role_id est toujours NULL, assigner le rôle 'commercial' par défaut (ou le premier rôle disponible)
UPDATE public.utilisateurs u
SET role_id = COALESCE(
  (SELECT id FROM public.roles WHERE slug = 'commercial' LIMIT 1),
  (SELECT id FROM public.roles ORDER BY created_at ASC LIMIT 1)
)
WHERE u.role_id IS NULL;

-- ÉTAPE 3: Vérifier que tous les role_id sont valides (existent dans roles)
-- Si un role_id ne correspond à aucun rôle, le corriger
UPDATE public.utilisateurs u
SET role_id = (
  SELECT id FROM public.roles 
  WHERE slug = COALESCE(u.role_slug, u.role, 'commercial')
  LIMIT 1
)
WHERE u.role_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.roles r WHERE r.id = u.role_id
  );

-- ÉTAPE 4: Vérifier la cohérence finale
-- Afficher un rapport des utilisateurs qui ont des incohérences
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM public.utilisateurs u
  LEFT JOIN public.roles r ON r.id = u.role_id
  WHERE u.role_id IS NULL
     OR (u.role_slug IS NOT NULL AND r.slug IS DISTINCT FROM u.role_slug)
     OR (u.role IS NOT NULL AND r.slug IS DISTINCT FROM u.role);
  
  IF inconsistent_count > 0 THEN
    RAISE WARNING 'Il y a % utilisateurs avec des incohérences de rôle. Vérifiez avant de continuer.', inconsistent_count;
  ELSE
    RAISE NOTICE 'Tous les utilisateurs ont un role_id valide et cohérent.';
  END IF;
END $$;

-- ÉTAPE 5: Supprimer toutes les vues et policies qui dépendent de utilisateurs.role ou utilisateurs.role_slug
-- Ces policies seront recréées dans la migration 20251202_update_rls_policies_use_role_relation.sql

-- Supprimer la policy qui dépend de la vue current_user_role
DROP POLICY IF EXISTS "roles_super_admin_all" ON public.roles;

-- Supprimer la vue current_user_role si elle existe (elle dépend probablement de role_slug)
DROP VIEW IF EXISTS public.current_user_role CASCADE;

-- Policies sur utilisateurs
DROP POLICY IF EXISTS "super_admin_all_access" ON public.utilisateurs;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can delete avatars" ON storage.objects;

-- Chercher et supprimer toutes les autres policies qui utilisent utilisateurs.role
-- Note: pg_policies n'a pas de colonne 'definition', on utilise 'qual' (USING) et 'with_check' (WITH CHECK)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE (qual IS NOT NULL AND (qual::text LIKE '%utilisateurs.role%' OR qual::text LIKE '%utilisateurs.role_slug%'))
       OR (with_check IS NOT NULL AND (with_check::text LIKE '%utilisateurs.role%' OR with_check::text LIKE '%utilisateurs.role_slug%'))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      policy_record.policyname, 
      policy_record.schemaname, 
      policy_record.tablename);
  END LOOP;
END $$;

-- ÉTAPE 6: Supprimer les index sur role et role_slug s'ils existent
DROP INDEX IF EXISTS public.idx_utilisateurs_role;
DROP INDEX IF EXISTS public.idx_utilisateurs_role_slug;
DROP INDEX IF EXISTS public.idx_profiles_role; -- Ancien nom possible

-- ÉTAPE 7: Ajouter un index sur role_id s'il n'existe pas
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role_id 
  ON public.utilisateurs(role_id)
  WHERE role_id IS NOT NULL;

-- ÉTAPE 8: Supprimer les colonnes role et role_slug
-- Note: PostgreSQL ne permet pas de supprimer plusieurs colonnes en une seule commande
ALTER TABLE public.utilisateurs DROP COLUMN IF EXISTS role;
ALTER TABLE public.utilisateurs DROP COLUMN IF EXISTS role_slug;

-- ÉTAPE 9: Vérification finale
DO $$
DECLARE
  users_without_role INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_without_role
  FROM public.utilisateurs
  WHERE role_id IS NULL;
  
  IF users_without_role > 0 THEN
    RAISE WARNING 'Il y a % utilisateurs sans role_id après la migration.', users_without_role;
  ELSE
    RAISE NOTICE 'Migration terminée avec succès. Tous les utilisateurs ont un role_id valide.';
  END IF;
END $$;

-- ============================================
-- Notes importantes:
-- - La table utilisateurs_role_backup contient les anciennes valeurs
-- - Pour restaurer: ALTER TABLE utilisateurs ADD COLUMN role TEXT, ADD COLUMN role_slug TEXT;
--   puis UPDATE utilisateurs u SET role = b.role, role_slug = b.role_slug 
--   FROM utilisateurs_role_backup b WHERE u.id = b.id;
-- ============================================

