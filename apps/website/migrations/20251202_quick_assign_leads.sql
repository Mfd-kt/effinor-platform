-- ============================================
-- Script SQL: Assigner rapidement des leads à un commercial
-- Date: 2025-12-02
-- Description: Assigns the first 10 unassigned leads to a specific commercial
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Remplacez l'email ci-dessous par l'email de votre commercial
-- 2. Exécutez ce script dans Supabase SQL Editor
--
-- ============================================

-- Trouver l'ID du commercial par email
DO $$
DECLARE
  v_commercial_id UUID;
  v_leads_updated INTEGER;
BEGIN
  -- Trouver l'ID du commercial
  SELECT id INTO v_commercial_id
  FROM public.utilisateurs 
  WHERE email = 'koutmoufdi@gmail.com'  -- ⚠️ REMPLACEZ PAR L'EMAIL DU COMMERCIAL
  AND role_slug = 'commercial'
  LIMIT 1;

  IF v_commercial_id IS NULL THEN
    RAISE EXCEPTION 'Commercial non trouvé avec cet email. Vérifiez l''email et le role_slug.';
  END IF;

  RAISE NOTICE 'Commercial trouvé: ID = %', v_commercial_id;

  -- Assigner les 10 premiers leads non assignés
  UPDATE public.leads
  SET 
    commercial_assigne_id = v_commercial_id,
    updated_at = NOW()
  WHERE commercial_assigne_id IS NULL
  AND id IN (
    SELECT id 
    FROM public.leads 
    WHERE commercial_assigne_id IS NULL 
    ORDER BY created_at DESC 
    LIMIT 10
  );

  GET DIAGNOSTICS v_leads_updated = ROW_COUNT;

  RAISE NOTICE '✅ % leads assignés au commercial', v_leads_updated;

  -- Afficher les leads assignés (via une requête séparée)
  RAISE NOTICE 'Leads assignés:';

END $$;

-- Vérification finale
SELECT 
  l.id,
  l.nom,
  l.email,
  l.commercial_assigne_id,
  u.email as commercial_email,
  u.prenom || ' ' || u.nom as commercial_nom,
  l.created_at
FROM public.leads l
LEFT JOIN public.utilisateurs u ON l.commercial_assigne_id = u.id
WHERE l.commercial_assigne_id IS NOT NULL
ORDER BY l.created_at DESC
LIMIT 20;

