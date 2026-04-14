-- =============================================================================
-- RBAC — Utilisateurs de démo pour les essais (rôles métier)
-- =============================================================================
--
-- PRÉREQUIS
-- ---------
-- 1) Avoir appliqué la migration qui insère les rôles :
--    supabase/migrations/20260402140000_rbac_seed_roles.sql
--
-- 2) Créer les comptes dans Supabase Auth (même mot de passe pour les tests si
--    vous voulez) :
--    Dashboard → Authentication → Users → Add user
--    Ou : inscription depuis la page /login de l’app pour chaque email.
--
--    Emails attendus (modifiables ci‑dessous si vous les changez) :
--      • demo-super-admin@effinor.local
--      • demo-agent@effinor.local
--      • demo-confirmeur@effinor.local (rôle applicatif : code = confirmer)
--      • demo-closer@effinor.local
--      • demo-directeur@effinor.local
--
-- 3) Exécuter CE script dans SQL Editor (Supabase) ou : psql … -f seed_rbac_demo_users.sql
--
-- Le trigger handle_new_user crée déjà public.profiles ; ce script ajoute
-- seulement les lignes public.user_roles.
--
-- Alternative (tout en un, base locale) : voir seed_rbac_demo_users_local_auth.sql
-- (crée auth.users + auth.identities + rôles, mot de passe DemoEffinor2026!).
-- =============================================================================

-- Libellés lisibles sur les fiches (optionnel)
UPDATE public.profiles SET full_name = 'Démo Super Admin'
WHERE email = 'demo-super-admin@effinor.local';
UPDATE public.profiles SET full_name = 'Démo Agent commercial'
WHERE email = 'demo-agent@effinor.local';
UPDATE public.profiles SET full_name = 'Démo Confirmateur'
WHERE email = 'demo-confirmeur@effinor.local';
UPDATE public.profiles SET full_name = 'Démo Closer'
WHERE email = 'demo-closer@effinor.local';
UPDATE public.profiles SET full_name = 'Démo Directeur commercial'
WHERE email = 'demo-directeur@effinor.local';

-- Un utilisateur = un rôle (adapter les emails si besoin)
INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email = 'demo-super-admin@effinor.local' AND r.code = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email = 'demo-agent@effinor.local' AND r.code = 'sales_agent'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email = 'demo-confirmeur@effinor.local' AND r.code = 'confirmer'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email = 'demo-closer@effinor.local' AND r.code = 'closer'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email = 'demo-directeur@effinor.local' AND r.code = 'sales_director'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Vérification rapide
SELECT p.email, p.full_name, array_agg(r.code ORDER BY r.code) AS roles
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
JOIN public.roles r ON r.id = ur.role_id
WHERE p.email LIKE 'demo-%@effinor.local'
GROUP BY p.id, p.email, p.full_name
ORDER BY p.email;
