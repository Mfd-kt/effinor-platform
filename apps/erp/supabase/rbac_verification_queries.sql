-- =============================================================================
-- RBAC — Requêtes de contrôle (email + codes de rôles)
-- =============================================================================
-- À exécuter dans le SQL Editor du projet Supabase (même instance que l’app).
--
-- Rappel : le *code* métier en base est `confirmer` ; l’email de démo peut être
-- `demo-confirmeur@effinor.local` (orthographe alignée sur Auth / prod).
-- =============================================================================

-- 1) Vue synthétique : tous les profils de démo avec leurs rôles applicatifs
SELECT
  p.id AS profile_id,
  p.email,
  p.full_name,
  coalesce(
    array_agg(r.code ORDER BY r.code) FILTER (WHERE r.code IS NOT NULL),
    ARRAY[]::text[]
  ) AS role_codes
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.roles r ON r.id = ur.role_id
WHERE p.email LIKE 'demo-%@effinor.local'
   OR p.email IN ('admin@effinor.local')
GROUP BY p.id, p.email, p.full_name
ORDER BY p.email;

-- 2) Comptes de démo sans aucun rôle assigné (anomalie à corriger avec seed_rbac_demo_users.sql)
SELECT p.id, p.email, p.full_name
FROM public.profiles p
WHERE (p.email LIKE 'demo-%@effinor.local' OR p.email = 'admin@effinor.local')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
  )
ORDER BY p.email;

-- 3) Détail ligne à ligne (un utilisateur × un rôle par ligne)
SELECT
  p.email,
  r.code AS role_code,
  r.label_fr
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
JOIN public.roles r ON r.id = ur.role_id
WHERE p.email LIKE 'demo-%@effinor.local'
   OR p.email = 'admin@effinor.local'
ORDER BY p.email, r.code;
