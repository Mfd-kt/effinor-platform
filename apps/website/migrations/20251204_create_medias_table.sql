-- ============================================
-- Migration: Créer la table medias
-- ============================================
-- Date: 2025-12-04
-- Description: Table pour gérer la médiathèque (images, documents)
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
END $$;

-- ============================================
-- ÉTAPE 2: Créer la table medias
-- ============================================

CREATE TABLE IF NOT EXISTS public.medias (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  category TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
);

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE public.medias IS 'Table pour gérer la médiathèque (images, documents)';
COMMENT ON COLUMN public.medias.id IS 'Identifiant unique du média';
COMMENT ON COLUMN public.medias.url IS 'URL du fichier (Supabase Storage)';
COMMENT ON COLUMN public.medias.alt_text IS 'Texte alternatif pour le SEO et l''accessibilité';
COMMENT ON COLUMN public.medias.category IS 'Catégorie du média (ex: "ressource", "realisation", "blog")';
COMMENT ON COLUMN public.medias.file_name IS 'Nom du fichier original';
COMMENT ON COLUMN public.medias.file_size IS 'Taille du fichier en octets';
COMMENT ON COLUMN public.medias.mime_type IS 'Type MIME du fichier (ex: "image/jpeg", "application/pdf")';

-- ============================================
-- ÉTAPE 3: Créer les index
-- ============================================

-- Index sur category pour filtrer par catégorie
CREATE INDEX IF NOT EXISTS idx_medias_category ON public.medias(category);

-- Index sur created_at pour trier par date
CREATE INDEX IF NOT EXISTS idx_medias_created_at ON public.medias(created_at DESC);

-- ============================================
-- ÉTAPE 4: Activer RLS sur la table medias
-- ============================================

ALTER TABLE public.medias ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 5: Supprimer les anciennes policies (si elles existent)
-- ============================================

DROP POLICY IF EXISTS "Public can view medias" ON public.medias;
DROP POLICY IF EXISTS "Admins can manage medias" ON public.medias;

-- ============================================
-- ÉTAPE 6: Créer les policies RLS
-- ============================================

-- Policy 1: Lecture publique
CREATE POLICY "Public can view medias"
ON public.medias
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy 2: Écriture admin uniquement
CREATE POLICY "Admins can manage medias"
ON public.medias
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
-- ÉTAPE 7: Vérifications finales
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'medias'
  ) THEN
    RAISE EXCEPTION 'La table medias n''a pas été créée correctement';
  END IF;
END $$;

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès: Table medias créée avec RLS policies';
  RAISE NOTICE '📋 Vérifications:';
  RAISE NOTICE '   - Table medias: ✅';
  RAISE NOTICE '   - Index créés: ✅';
  RAISE NOTICE '   - RLS activé: ✅';
  RAISE NOTICE '   - Policies créées: ✅';
END $$;














