-- ============================================
-- Migration: Create product_accessories table
-- Date: 2025-12-04
-- Description:
--   Table de liaison entre les produits et leurs accessoires.
--   Chaque accessoire est lui‑même un produit dans public.products.
--   Idempotent: utilise IF NOT EXISTS pour éviter les erreurs si déjà créé.
-- ============================================

-- 1. Créer la table si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.tables
    WHERE  table_schema = 'public'
    AND    table_name   = 'product_accessories'
  ) THEN
    CREATE TABLE public.product_accessories (
      id            BIGSERIAL PRIMARY KEY,
      product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      accessory_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
      priorite      INT  DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT product_accessories_unique_pair
        UNIQUE (product_id, accessory_id),

      CONSTRAINT product_accessories_not_self
        CHECK (product_id <> accessory_id)
    );
  END IF;
END $$;

COMMENT ON TABLE public.product_accessories IS
  'Table de liaison entre un produit principal et ses accessoires compatibles';

COMMENT ON COLUMN public.product_accessories.product_id IS
  'Produit principal (public.products.id)';

COMMENT ON COLUMN public.product_accessories.accessory_id IS
  'Produit accessoire (public.products.id)';

COMMENT ON COLUMN public.product_accessories.priorite IS
  'Ordre d''affichage des accessoires pour un produit donné (0 = défaut)';

-- 2. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_product_accessories_product_id
  ON public.product_accessories(product_id);

CREATE INDEX IF NOT EXISTS idx_product_accessories_accessory_id
  ON public.product_accessories(accessory_id);

-- 3. Activer RLS
ALTER TABLE public.product_accessories ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer d'anciennes politiques éventuelles
DROP POLICY IF EXISTS "Public can view product accessories" ON public.product_accessories;
DROP POLICY IF EXISTS "Admins can manage product accessories" ON public.product_accessories;

-- 5. Policies RLS

-- 5.1 Lecture publique (site vitrine, comme pour products)
CREATE POLICY "Public can view product accessories"
ON public.product_accessories
FOR SELECT
TO anon, authenticated
USING (true);

-- 5.2 Gestion complète réservée aux admins / super_admins
-- Utilise la fonction helper is_admin_user() qui évite les problèmes de récursion RLS
CREATE POLICY "Admins can manage product accessories"
ON public.product_accessories
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());


