-- ============================================
-- Migration: Ajout de la colonne formulaire_data JSONB
-- Date: 2026-01-12
-- Description: Ajoute la colonne formulaire_data (JSONB) à la table leads
--              pour stocker toutes les données du formulaire, notamment les bâtiments
-- ============================================

-- ÉTAPE 1: Ajouter la colonne formulaire_data (JSONB) si elle n'existe pas
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS formulaire_data JSONB DEFAULT '{}'::jsonb;

-- ÉTAPE 2: Créer un index GIN pour améliorer les performances des requêtes sur JSONB
-- Cet index permet des recherches rapides dans les données JSON
CREATE INDEX IF NOT EXISTS idx_leads_formulaire_data 
ON leads USING GIN (formulaire_data);

-- ÉTAPE 3: Créer un index spécifique pour les bâtiments (optionnel mais recommandé)
-- Cet index permet de rechercher rapidement les leads qui ont des bâtiments
CREATE INDEX IF NOT EXISTS idx_leads_formulaire_data_buildings 
ON leads USING GIN ((formulaire_data -> 'buildings'));

-- ÉTAPE 4: Commenter la colonne pour la documentation
COMMENT ON COLUMN leads.formulaire_data IS 
'Colonne JSONB stockant toutes les données du formulaire, incluant les bâtiments dans un tableau buildings';

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Pour vérifier que la colonne a été créée, exécutez :
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' AND column_name = 'formulaire_data';

-- Pour vérifier les index créés :
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'leads' AND indexname LIKE '%formulaire_data%';

-- ============================================
-- EXEMPLE DE STRUCTURE JSON ATTENDUE
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
--       "interiorLighting": {
--         "neon": {
--           "enabled": true,
--           "quantity": "10",
--           "powerPerUnit": "58"
--         }
--       },
--       "exteriorLighting": {
--         "changedByCEE": false,
--         "type": "Projecteurs halogènes",
--         "quantity": "20"
--       }
--     }
--   ],
--   "technicalData": {
--     "ceilingHeight": "5",
--     "heating": true,
--     "heatingMode": "gas",
--     "heatingPower": "100",
--     "heatingSetpoint": "19",
--     "interiorLighting": {...}
--   },
--   "step1": {...},
--   "step2": {...},
--   ...
-- }

-- ============================================
-- INSTRUCTIONS D'EXÉCUTION
-- ============================================
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script complet
-- 4. Exécutez le script (bouton RUN)
-- 5. Vérifiez que la colonne a été créée dans Table Editor > leads
-- 6. Vérifiez que les index ont été créés dans Database > Indexes

-- ============================================
-- NOTES
-- ============================================
-- - La colonne products est conservée pour la compatibilité avec l'ancien système
-- - Les données peuvent être migrées de products vers formulaire_data si nécessaire
-- - Le type JSONB permet des requêtes SQL puissantes sur les données JSON
-- - L'index GIN améliore les performances des recherches dans les données JSON

