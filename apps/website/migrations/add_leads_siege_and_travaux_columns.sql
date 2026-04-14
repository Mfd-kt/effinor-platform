-- Migration: Ajout des colonnes pour Siège Social et Site des Travaux
-- Date: 2025-01-XX
-- Description: Ajoute les colonnes nécessaires pour distinguer le siège social du site des travaux

-- ============================================
-- COLONNES POUR SIÈGE SOCIAL
-- ============================================

-- Renommer les colonnes existantes pour plus de clarté (optionnel)
-- Si vous voulez garder les anciennes colonnes pour compatibilité, on peut aussi créer de nouvelles colonnes
-- Ici, on va créer des colonnes spécifiques pour le siège social

-- Adresse du siège (si différent de adresse générale)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS adresse_siege TEXT;

-- Ville siège (si différent de ville générale)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS ville_siege TEXT;

-- Code postal siège (si différent de code_postal général)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS code_postal_siege TEXT;

-- SIREN (9 chiffres - préfixe du SIRET)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS siren TEXT;

-- ============================================
-- COLONNES POUR SITE DES TRAVAUX
-- ============================================

-- Raison sociale du site des travaux (peut être différent du siège social)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS raison_sociale_travaux TEXT;

-- Adresse des travaux
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS adresse_travaux TEXT;

-- Ville travaux
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS ville_travaux TEXT;

-- Code postal travaux
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS code_postal_travaux TEXT;

-- SIRET du site des travaux (peut être différent du SIRET du siège social)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS siret_site_travaux TEXT;

-- Région (ex: Nouvelle-Aquitaine)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS region TEXT;

-- Zone climatique (ex: H1, H2, H3)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS zone_climatique TEXT;

-- ============================================
-- MIGRATION DES DONNÉES EXISTANTES (Optionnel)
-- ============================================

-- Si vous voulez migrer les données existantes vers les nouvelles colonnes
-- Décommenter les lignes suivantes si nécessaire

-- Copier les données existantes vers les colonnes siège social si elles sont vides
-- UPDATE leads 
-- SET 
--   adresse_siege = COALESCE(adresse_siege, adresse),
--   ville_siege = COALESCE(ville_siege, ville),
--   code_postal_siege = COALESCE(code_postal_siege, code_postal),
--   siren = COALESCE(siren, LEFT(siret, 9))
-- WHERE adresse IS NOT NULL OR ville IS NOT NULL OR code_postal IS NOT NULL OR siret IS NOT NULL;

-- ============================================
-- CONTRAINTES ET INDEXES
-- ============================================

-- Index pour recherche par SIREN
CREATE INDEX IF NOT EXISTS idx_leads_siren ON leads(siren) WHERE siren IS NOT NULL;

-- Index pour recherche par SIRET site travaux
CREATE INDEX IF NOT EXISTS idx_leads_siret_site_travaux ON leads(siret_site_travaux) WHERE siret_site_travaux IS NOT NULL;

-- Index pour recherche par région
CREATE INDEX IF NOT EXISTS idx_leads_region ON leads(region) WHERE region IS NOT NULL;

-- Index pour recherche par zone climatique
CREATE INDEX IF NOT EXISTS idx_leads_zone_climatique ON leads(zone_climatique) WHERE zone_climatique IS NOT NULL;

-- ============================================
-- COMMENTAIRES SUR LES COLONNES
-- ============================================

COMMENT ON COLUMN leads.adresse_siege IS 'Adresse du siège social de l''entreprise';
COMMENT ON COLUMN leads.ville_siege IS 'Ville du siège social';
COMMENT ON COLUMN leads.code_postal_siege IS 'Code postal du siège social';
COMMENT ON COLUMN leads.siren IS 'Numéro SIREN (9 chiffres, préfixe du SIRET)';
COMMENT ON COLUMN leads.raison_sociale_travaux IS 'Raison sociale du site où seront effectués les travaux';
COMMENT ON COLUMN leads.adresse_travaux IS 'Adresse du site où seront effectués les travaux';
COMMENT ON COLUMN leads.ville_travaux IS 'Ville du site des travaux';
COMMENT ON COLUMN leads.code_postal_travaux IS 'Code postal du site des travaux';
COMMENT ON COLUMN leads.siret_site_travaux IS 'SIRET du site des travaux (peut être différent du siège social)';
COMMENT ON COLUMN leads.region IS 'Région du site des travaux (ex: Nouvelle-Aquitaine)';
COMMENT ON COLUMN leads.zone_climatique IS 'Zone climatique RT2012 (H1, H2, H3)';

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que les colonnes ont été créées
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND column_name IN (
    'adresse_siege', 
    'ville_siege', 
    'code_postal_siege',
    'siren',
    'raison_sociale_travaux',
    'adresse_travaux',
    'ville_travaux',
    'code_postal_travaux',
    'siret_site_travaux',
    'region',
    'zone_climatique'
  )
ORDER BY column_name;

