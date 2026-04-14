-- ============================================
-- Migration: Créer la table realisations
-- ============================================
-- Date: 2025-12-04
-- Description: Table pour gérer les réalisations (case studies / chantiers)
-- ============================================

-- ============================================
-- ÉTAPE 1: Vérifier que les fonctions helper existent
-- ============================================

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
-- ÉTAPE 2: Créer la table realisations
-- ============================================

CREATE TABLE IF NOT EXISTS public.realisations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  slug TEXT NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  client TEXT,
  secteur TEXT,
  ville TEXT,
  pays TEXT DEFAULT 'France',
  description_courte TEXT,
  contexte TEXT,
  solution TEXT,
  resultats TEXT,
  economie_energie_pct NUMERIC,
  produits_utilises JSONB,
  images JSONB,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  seo_description TEXT,
  seo_og_image_url TEXT
);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.realisations IS 'Table pour gérer les réalisations (case studies / chantiers)';
COMMENT ON COLUMN public.realisations.id IS 'Identifiant unique de la réalisation';
COMMENT ON COLUMN public.realisations.slug IS 'Slug URL-friendly unique pour la réalisation';
COMMENT ON COLUMN public.realisations.titre IS 'Titre de la réalisation';
COMMENT ON COLUMN public.realisations.client IS 'Nom du client';
COMMENT ON COLUMN public.realisations.secteur IS 'Secteur d''activité';
COMMENT ON COLUMN public.realisations.ville IS 'Ville du projet';
COMMENT ON COLUMN public.realisations.pays IS 'Pays du projet (défaut: France)';
COMMENT ON COLUMN public.realisations.description_courte IS 'Description courte pour la liste';
COMMENT ON COLUMN public.realisations.contexte IS 'Contexte client et problématique';
COMMENT ON COLUMN public.realisations.solution IS 'Solution mise en place';
COMMENT ON COLUMN public.realisations.resultats IS 'Résultats obtenus';
COMMENT ON COLUMN public.realisations.economie_energie_pct IS 'Économie d''énergie en pourcentage';
COMMENT ON COLUMN public.realisations.produits_utilises IS 'Produits utilisés (JSONB array)';
COMMENT ON COLUMN public.realisations.images IS 'Images (JSONB array avec {url, legend})';
COMMENT ON COLUMN public.realisations.published_at IS 'Date de publication (null si brouillon)';
COMMENT ON COLUMN public.realisations.status IS 'Statut: draft (brouillon) ou published (publié)';
COMMENT ON COLUMN public.realisations.seo_title IS 'Titre SEO personnalisé (optionnel)';
COMMENT ON COLUMN public.realisations.seo_description IS 'Description SEO (optionnel)';
COMMENT ON COLUMN public.realisations.seo_og_image_url IS 'URL de l''image Open Graph (optionnel)';

-- ============================================
-- ÉTAPE 3: Créer les index
-- ============================================

-- Index sur slug (déjà géré par UNIQUE constraint)
-- Index sur status pour filtrer rapidement les réalisations publiées
CREATE INDEX IF NOT EXISTS idx_realisations_status ON public.realisations(status);

-- Index sur published_at pour trier par date de publication
CREATE INDEX IF NOT EXISTS idx_realisations_published_at ON public.realisations(published_at DESC NULLS LAST);

-- Index composite sur (status, published_at) pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_realisations_status_published_at ON public.realisations(status, published_at DESC NULLS LAST) 
WHERE status = 'published';

-- Index sur secteur pour filtrer par secteur
CREATE INDEX IF NOT EXISTS idx_realisations_secteur ON public.realisations(secteur);

-- ============================================
-- ÉTAPE 4: Créer le trigger pour updated_at
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_realisations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_realisations_updated_at() IS 'Met à jour automatiquement updated_at lors de la modification d''une réalisation';

-- Trigger pour appeler la fonction à chaque UPDATE
DROP TRIGGER IF EXISTS trigger_update_realisations_updated_at ON public.realisations;
CREATE TRIGGER trigger_update_realisations_updated_at
  BEFORE UPDATE ON public.realisations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_realisations_updated_at();

-- ============================================
-- ÉTAPE 5: Activer RLS sur la table realisations
-- ============================================

ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6: Supprimer les anciennes policies (si elles existent)
-- ============================================

DROP POLICY IF EXISTS "Public can view published realisations" ON public.realisations;
DROP POLICY IF EXISTS "Admins can manage realisations" ON public.realisations;

-- ============================================
-- ÉTAPE 7: Créer les policies RLS
-- ============================================

-- Policy 1: Lecture publique pour les réalisations publiées
CREATE POLICY "Public can view published realisations"
ON public.realisations
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Policy 2: Écriture admin uniquement
CREATE POLICY "Admins can manage realisations"
ON public.realisations
FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.has_role('manager')
  OR public.has_role('backoffice')
)
WITH CHECK (
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
    AND tablename = 'realisations'
  ) THEN
    RAISE EXCEPTION 'La table realisations n''a pas été créée correctement';
  END IF;
END $$;

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'realisations'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur la table realisations';
  END IF;
END $$;

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès: Table realisations créée avec RLS policies';
  RAISE NOTICE '📋 Vérifications:';
  RAISE NOTICE '   - Table realisations: ✅';
  RAISE NOTICE '   - Index créés: ✅';
  RAISE NOTICE '   - Trigger updated_at: ✅';
  RAISE NOTICE '   - RLS activé: ✅';
  RAISE NOTICE '   - Policies créées: ✅';
END $$;














