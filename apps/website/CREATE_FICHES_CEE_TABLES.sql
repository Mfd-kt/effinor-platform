-- ============================================
-- Script SQL pour créer les tables du système Fiches CEE
-- ============================================

-- Étape 1: Créer la table fiches_cee
CREATE TABLE IF NOT EXISTS fiches_cee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE, -- Ex: BAT-EQ-123
  titre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT, -- Description courte
  description_longue TEXT, -- Description détaillée
  secteur TEXT NOT NULL DEFAULT 'Tous secteurs', -- Tertiaire, Industrie, Résidentiel, Agriculture, Tous secteurs
  montant_cee NUMERIC(10, 2), -- Montant de la prime CEE
  unite TEXT DEFAULT '€/unité', -- Unité du montant
  conditions TEXT, -- Conditions d'éligibilité
  eligible_professionnels BOOLEAN DEFAULT true,
  eligible_particuliers BOOLEAN DEFAULT false,
  document_legal_pdf TEXT, -- URL du document PDF
  image TEXT, -- URL de l'image
  date_debut DATE, -- Date de début de validité
  date_fin DATE, -- Date de fin de validité
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0, -- Pour trier l'affichage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étape 2: Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_fiches_cee_slug ON fiches_cee(slug);
CREATE INDEX IF NOT EXISTS idx_fiches_cee_actif ON fiches_cee(actif);
CREATE INDEX IF NOT EXISTS idx_fiches_cee_secteur ON fiches_cee(secteur);
CREATE INDEX IF NOT EXISTS idx_fiches_cee_ordre ON fiches_cee(ordre);
CREATE INDEX IF NOT EXISTS idx_fiches_cee_numero ON fiches_cee(numero);

-- Étape 3: Créer la table de relation many-to-many produits_fiches_cee
CREATE TABLE IF NOT EXISTS produits_fiches_cee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  fiche_cee_id UUID NOT NULL REFERENCES fiches_cee(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produit_id, fiche_cee_id) -- Évite les doublons
);

-- Étape 4: Créer les index pour la table de relation
CREATE INDEX IF NOT EXISTS idx_produits_fiches_cee_produit_id ON produits_fiches_cee(produit_id);
CREATE INDEX IF NOT EXISTS idx_produits_fiches_cee_fiche_cee_id ON produits_fiches_cee(fiche_cee_id);

-- ============================================
-- Instructions:
-- ============================================
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script complet
-- 4. Exécutez le script (bouton RUN)
-- 5. Vérifiez que les tables ont été créées dans Table Editor
--
-- Tables créées:
-- - fiches_cee: Stocke toutes les fiches CEE
-- - produits_fiches_cee: Table de liaison many-to-many entre produits et fiches CEE
--
-- Note: Les foreign keys sont configurées avec ON DELETE CASCADE
-- pour supprimer automatiquement les relations si un produit ou une fiche est supprimé.
-- ============================================

