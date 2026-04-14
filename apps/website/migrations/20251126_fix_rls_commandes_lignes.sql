-- Migration: Correction RLS pour commandes_lignes
-- Date: 2025-11-26
-- Description: 
--   Permettre aux utilisateurs anonymes (anon) d'insérer des lignes de commande
--   lorsqu'ils créent une commande depuis le site e-commerce public.

-- 1. Vérifier que RLS est activé
ALTER TABLE public.commandes_lignes ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies si elles existent (optionnel, pour repartir propre)
-- DROP POLICY IF EXISTS "Allow anonymous insert for order lines" ON public.commandes_lignes;
-- DROP POLICY IF EXISTS "System can insert order lines" ON public.commandes_lignes;

-- 3. Policy pour permettre l'insertion anonyme de lignes de commande
-- Cette policy permet aux utilisateurs anonymes d'insérer des lignes
-- si la commande correspondante existe déjà et a été créée récemment (dans les 5 dernières minutes)
-- OU si la commande a le même email que celui fourni dans les métadonnées (si disponible)
CREATE POLICY "Allow anonymous insert for order lines"
ON public.commandes_lignes
FOR INSERT
TO anon
WITH CHECK (
  -- La commande doit exister
  EXISTS (
    SELECT 1 FROM public.commandes
    WHERE commandes.id = commandes_lignes.commande_id
    AND (
      -- La commande a été créée dans les 5 dernières minutes
      commandes.created_at > NOW() - INTERVAL '5 minutes'
      -- OU on peut vérifier d'autres critères selon vos besoins
    )
  )
);

-- 4. Policy pour permettre l'insertion par les utilisateurs authentifiés (admins)
CREATE POLICY "Authenticated users can insert order lines"
ON public.commandes_lignes
FOR INSERT
TO authenticated
WITH CHECK (
  -- Les admins peuvent insérer des lignes pour n'importe quelle commande
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Policy pour la lecture (SELECT) - permettre aux admins et aux propriétaires de voir les lignes
CREATE POLICY "Users can view order lines"
ON public.commandes_lignes
FOR SELECT
TO authenticated
USING (
  -- Admins peuvent voir toutes les lignes
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  -- OU la commande appartient à l'utilisateur (si vous avez un système de propriétaire)
  -- OR EXISTS (
  --   SELECT 1 FROM public.commandes
  --   WHERE commandes.id = commandes_lignes.commande_id
  --   AND commandes.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  -- )
);

-- 6. Policy pour les utilisateurs anonymes (SELECT) - optionnel, peut-être pas nécessaire
-- CREATE POLICY "Anonymous can view own order lines"
-- ON public.commandes_lignes
-- FOR SELECT
-- TO anon
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.commandes
--     WHERE commandes.id = commandes_lignes.commande_id
--     AND commandes.created_at > NOW() - INTERVAL '1 hour'
--   )
-- );

-- Notes:
-- - La policy INSERT pour anon vérifie que la commande existe et est récente
-- - Cela empêche l'insertion de lignes pour des commandes anciennes ou inexistantes
-- - Vous pouvez ajuster l'intervalle de temps selon vos besoins
-- - Pour la production, vous pourriez vouloir une vérification plus stricte (par exemple, via un token)

