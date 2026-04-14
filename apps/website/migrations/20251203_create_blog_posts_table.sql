-- ============================================
-- Migration: Créer la table posts pour le module Blog
-- ============================================
-- Date: 2025-12-03
-- Description: Création complète de la table posts avec RLS policies
-- ============================================

-- ============================================
-- ÉTAPE 1: Vérifier que les fonctions helper existent
-- ============================================
-- Les fonctions is_admin_user() et has_role() doivent exister
-- Si elles n'existent pas, exécuter d'abord: migrations/20251202_fix_utilisateurs_rls_recursion.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin_user' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'La fonction is_admin_user() n''existe pas. Exécutez d''abord migrations/20251202_fix_utilisateurs_rls_recursion.sql';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'La fonction has_role() n''existe pas. Exécutez d''abord migrations/20251202_fix_utilisateurs_rls_recursion.sql';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Créer la table posts
-- ============================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  author_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE RESTRICT,
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[]
);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.posts IS 'Table des articles de blog';
COMMENT ON COLUMN public.posts.id IS 'Identifiant unique de l''article';
COMMENT ON COLUMN public.posts.created_at IS 'Date de création de l''article';
COMMENT ON COLUMN public.posts.updated_at IS 'Date de dernière modification (mise à jour automatique)';
COMMENT ON COLUMN public.posts.title IS 'Titre de l''article';
COMMENT ON COLUMN public.posts.slug IS 'Slug URL-friendly unique pour l''article';
COMMENT ON COLUMN public.posts.excerpt IS 'Résumé court de l''article (pour la liste)';
COMMENT ON COLUMN public.posts.content IS 'Contenu complet de l''article (markdown ou texte)';
COMMENT ON COLUMN public.posts.cover_image_url IS 'URL de l''image de couverture';
COMMENT ON COLUMN public.posts.status IS 'Statut de l''article: draft (brouillon) ou published (publié)';
COMMENT ON COLUMN public.posts.published_at IS 'Date de publication (null si brouillon)';
COMMENT ON COLUMN public.posts.author_id IS 'Référence vers l''auteur (utilisateurs.id)';
COMMENT ON COLUMN public.posts.seo_title IS 'Titre SEO personnalisé (optionnel)';
COMMENT ON COLUMN public.posts.seo_description IS 'Description SEO (optionnel)';
COMMENT ON COLUMN public.posts.tags IS 'Tableau de tags pour catégoriser l''article';

-- ============================================
-- ÉTAPE 3: Créer les index
-- ============================================

-- Index sur status pour filtrer rapidement les posts publiés
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);

-- Index sur published_at pour trier par date de publication
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC NULLS LAST);

-- Index composite sur (status, published_at) pour requêtes fréquentes (liste publique)
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON public.posts(status, published_at DESC NULLS LAST) 
WHERE status = 'published';

-- Index sur author_id pour les requêtes par auteur
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);

-- Index sur slug (déjà géré par UNIQUE constraint, mais utile pour les recherches)
-- L'index unique est créé automatiquement par la contrainte UNIQUE

-- ============================================
-- ÉTAPE 4: Créer le trigger pour updated_at
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_posts_updated_at() IS 'Met à jour automatiquement updated_at lors de la modification d''un post';

-- Trigger pour appeler la fonction à chaque UPDATE
DROP TRIGGER IF EXISTS trigger_update_posts_updated_at ON public.posts;
CREATE TRIGGER trigger_update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_posts_updated_at();

-- ============================================
-- ÉTAPE 5: Activer RLS sur la table posts
-- ============================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6: Supprimer les anciennes policies (si elles existent)
-- ============================================

DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can edit own posts" ON public.posts;
DROP POLICY IF EXISTS "Managers can manage posts" ON public.posts;
DROP POLICY IF EXISTS "Backoffice can manage posts" ON public.posts;

-- ============================================
-- ÉTAPE 7: Créer les policies RLS
-- ============================================

-- Policy 1: Lecture publique (site web) - Uniquement les posts publiés
-- Permet aux utilisateurs anonymes et authentifiés de voir les posts publiés
CREATE POLICY "Public can view published posts"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Policy 2: Lecture dashboard (utilisateurs authentifiés) - Tous les statuts
-- Permet aux utilisateurs authentifiés du dashboard de voir tous les articles (draft + published)
CREATE POLICY "Authenticated can view all posts"
ON public.posts
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: INSERT - Rôles autorisés uniquement
-- Seuls super_admin, admin, manager et backoffice peuvent créer des posts
CREATE POLICY "Admins and managers can create posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- Policy 4: UPDATE - Rôles autorisés OU auteur du post
-- Les admins/managers peuvent modifier tous les posts
-- Les auteurs peuvent modifier leurs propres posts
CREATE POLICY "Admins managers and authors can update posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
  OR EXISTS (
    SELECT 1 FROM public.utilisateurs u
    WHERE u.id = posts.author_id
    AND u.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
  OR EXISTS (
    SELECT 1 FROM public.utilisateurs u
    WHERE u.id = posts.author_id
    AND u.auth_user_id = auth.uid()
  )
);

-- Policy 5: DELETE - Rôles autorisés uniquement
-- Seuls super_admin, admin, manager et backoffice peuvent supprimer des posts
-- Les auteurs ne peuvent pas supprimer leurs propres posts (sécurité)
CREATE POLICY "Admins and managers can delete posts"
ON public.posts
FOR DELETE
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
);

-- ============================================
-- ÉTAPE 8: Vérifications finales
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'posts'
  ) THEN
    RAISE EXCEPTION 'La table posts n''a pas été créée correctement';
  END IF;
END $$;

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'posts'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur la table posts';
  END IF;
END $$;

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès: Table posts créée avec RLS policies';
  RAISE NOTICE '📋 Vérifications:';
  RAISE NOTICE '   - Table posts: ✅';
  RAISE NOTICE '   - Index créés: ✅';
  RAISE NOTICE '   - Trigger updated_at: ✅';
  RAISE NOTICE '   - RLS activé: ✅';
  RAISE NOTICE '   - Policies créées: ✅';
END $$;

