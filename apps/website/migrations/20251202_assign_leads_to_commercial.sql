-- ============================================
-- Script SQL: Assigner des leads à un commercial pour test
-- Date: 2025-12-02
-- Description: Assigns existing leads to a commercial user for testing
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Remplacez 'VOTRE_COMMERCIAL_ID' par l'ID réel du commercial (UUID)
-- 2. Ou utilisez la requête ci-dessous pour trouver l'ID du commercial
-- 3. Exécutez ce script dans Supabase SQL Editor
--
-- ============================================

-- Option 1: Trouver l'ID du commercial par email
-- Remplacez 'koutmoufdi@gmail.com' par l'email du commercial
SELECT id, email, prenom, nom, role_slug 
FROM public.utilisateurs 
WHERE role_slug = 'commercial' 
AND email = 'koutmoufdi@gmail.com';

-- Option 2: Assigner les 10 premiers leads au commercial trouvé
-- Remplacez 'VOTRE_COMMERCIAL_ID' par l'ID du commercial (ex: '4fb7c7a8-6c4d-4898-9c49-f584b5035316')
UPDATE public.leads
SET commercial_assigne_id = '4fb7c7a8-6c4d-4898-9c49-f584b5035316'::uuid
WHERE commercial_assigne_id IS NULL
AND id IN (
  SELECT id FROM public.leads 
  WHERE commercial_assigne_id IS NULL 
  ORDER BY created_at DESC 
  LIMIT 10
);

-- Vérifier le résultat
SELECT 
  l.id,
  l.nom,
  l.email,
  l.commercial_assigne_id,
  u.email as commercial_email,
  u.prenom || ' ' || u.nom as commercial_nom
FROM public.leads l
LEFT JOIN public.utilisateurs u ON l.commercial_assigne_id = u.id
WHERE l.commercial_assigne_id = '4fb7c7a8-6c4d-4898-9c49-f584b5035316'::uuid
ORDER BY l.created_at DESC
LIMIT 20;



















