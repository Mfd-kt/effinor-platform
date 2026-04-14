-- ============================================
-- Migration : Ajout des champs de détails produits
-- Date : 2025-11-28
-- ============================================
-- 
-- Ajoute les nouveaux champs de détails techniques pour les produits :
-- - Matériaux
-- - Température de couleur
-- - Indice de rendu des couleurs
-- - Commande / Contrôle
-- - Tension d'entrée
-- - Angle de faisceau
-- - Protection
-- - Installation
-- - Dimensions
-- - Poids net
--
-- Ces champs sont stockés dans la table products
-- ============================================

-- Matériaux (ex: "Aluminium, Polycarbonate")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS materiaux TEXT;

-- Température de couleur (ex: "3000K", "4000-5000K", "6500K")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS temperature_couleur TEXT;

-- Indice de rendu des couleurs (ex: "80", "80+", "CRI 90")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS indice_rendu_couleurs TEXT;

-- Commande / Contrôle (ex: "Interrupteur", "Variateur 0-10V", "DALI")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS commande_controle TEXT;

-- Tension d'entrée (ex: "220-240V", "100-277V AC")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tension_entree TEXT;

-- Angle de faisceau (ex: "60°", "90-120°", "60° / 90°")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS angle_faisceau TEXT;

-- Protection (ex: "IP65", "IP66", "IK08")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS protection TEXT;

-- Installation (ex: "Suspension", "Fixation murale", "Poteau")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS installation TEXT;

-- Dimensions (ex: "500 x 200 x 150 mm", "L x l x H")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dimensions TEXT;

-- Poids net (ex: "2.5kg", "5.0 kg", "2.5-3.0 kg")
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS poids_net TEXT;

-- ============================================
-- Instructions:
-- ============================================
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez le script (bouton RUN)
-- 5. Vérifiez que les colonnes ont été créées dans Table Editor > products
-- ============================================