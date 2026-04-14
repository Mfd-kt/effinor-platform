-- ============================================
-- Script SQL pour ajouter la colonne formulaire_data JSONB
-- à la table leads pour stocker toutes les données du formulaire
-- Date: 2026-01-12
-- ============================================

-- Étape 1: Ajouter la colonne formulaire_data (JSONB) si elle n'existe pas
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS formulaire_data JSONB DEFAULT '{}'::jsonb;

-- Étape 2: Créer un index GIN pour améliorer les performances des requêtes sur JSONB
CREATE INDEX IF NOT EXISTS idx_leads_formulaire_data 
ON leads USING GIN (formulaire_data);

-- Étape 3: Créer un index spécifique pour les bâtiments (recommandé)
-- Cet index permet de rechercher rapidement les leads qui ont des bâtiments
CREATE INDEX IF NOT EXISTS idx_leads_formulaire_data_buildings 
ON leads USING GIN ((formulaire_data -> 'buildings'));

-- Étape 3 (Optionnel): Migrer les données existantes de products vers formulaire_data
-- Cette requête migre les données JSONB depuis products vers formulaire_data
-- 
-- ATTENTION: Décommentez cette section seulement si vous voulez migrer les données existantes
--
-- UPDATE leads
-- SET formulaire_data = products
-- WHERE products IS NOT NULL 
--   AND (formulaire_data IS NULL OR formulaire_data = '{}'::jsonb);

-- ============================================
-- Instructions:
-- ============================================
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez le script (bouton RUN)
-- 5. Vérifiez que la colonne a été créée dans Table Editor > leads
-- 6. Vérifiez que les index ont été créés dans Database > Indexes
--
-- ============================================
-- Vérification:
-- ============================================
-- Pour vérifier que la colonne existe :
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' AND column_name = 'formulaire_data';
--
-- Pour vérifier les index :
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'leads' AND indexname LIKE '%formulaire_data%';
--
-- ============================================
-- Structure JSON attendue pour les bâtiments:
-- ============================================
-- {
--   "buildings": [
--     {
--       "type": "warehouse",
--       "surface": 1000,
--       "ceilingHeight": 5,
--       "heating": true,
--       "heatingMode": "gas",
--       "heatingPower": "100",
--       "heatingSetpoint": "19",
--       "interiorLighting": {...},
--       "exteriorLighting": {...}
--     }
--   ]
-- }
--
-- Note: La colonne products est conservée pour la compatibilité
-- avec l'ancien système. On pourra la supprimer plus tard si nécessaire.
-- ============================================

