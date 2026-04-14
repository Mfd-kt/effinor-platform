-- ============================================
-- Script SQL pour ajouter la colonne categorie_id
-- à la table products avec relation foreign key
-- ============================================

-- Étape 1: Ajouter la colonne categorie_id (UUID) avec foreign key vers categories
-- ON DELETE SET NULL permet de garder le produit même si la catégorie est supprimée

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS categorie_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Étape 2: Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_products_categorie_id ON products(categorie_id);

-- Étape 3 (Optionnel): Migrer les données existantes de categorie (slug) vers categorie_id
-- Cette requête met à jour categorie_id en trouvant la catégorie correspondante par slug
-- 
-- ATTENTION: Décommentez cette section seulement si vous voulez migrer les données existantes
--
-- UPDATE products p
-- SET categorie_id = (
--   SELECT id 
--   FROM categories c 
--   WHERE c.slug = p.categorie 
--   LIMIT 1
-- )
-- WHERE p.categorie IS NOT NULL 
--   AND p.categorie_id IS NULL;

-- ============================================
-- Instructions:
-- ============================================
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez le script (bouton RUN)
-- 5. Vérifiez que la colonne a été créée dans Table Editor > products
--
-- Note: Gardez aussi la colonne 'categorie' (text) pour la compatibilité
-- avec l'ancien système. On pourra la supprimer plus tard une fois
-- que tous les produits auront un categorie_id.
-- ============================================