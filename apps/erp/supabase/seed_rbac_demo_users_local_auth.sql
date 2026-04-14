-- =============================================================================
-- RBAC — Création des comptes Auth + rôles (Supabase LOCAL / reset DB)
-- =============================================================================
--
-- Mot de passe pour TOUS les comptes de démo : DemoEffinor2026!
--
-- Usage typique :
--   supabase db reset
--   puis exécuter ce fichier dans le SQL Editor (ou le coller dans supabase/seed.sql)
--
-- PRÉREQUIS : migration des rôles appliquée (20260402140000_rbac_seed_roles.sql)
--
-- Si vous êtes sur le cloud Supabase : préférez créer les users dans le Dashboard
-- et utilisez uniquement seed_rbac_demo_users.sql (sans toucher à auth.*).
--
-- Ré-exécution : chaque INSERT est protégé (IF NOT EXISTS) pour éviter
-- duplicate key on users_pkey si les comptes existent déjà.
--
-- Colonnes token sur auth.users : GoTrue ne supporte pas NULL sur confirmation_token,
-- email_change, email_change_token_new, recovery_token → toujours '' (voir supabase/auth#1940).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_pw text := crypt('DemoEffinor2026!', gen_salt('bf'));
  v_inst uuid;

  -- UUID fixes pour retrouver les mêmes comptes après un reset
  v_super   uuid := 'a1000000-0000-4000-8000-000000000001';
  v_agent   uuid := 'a1000000-0000-4000-8000-000000000002';
  v_confirm uuid := 'a1000000-0000-4000-8000-000000000003';
  v_closer  uuid := 'a1000000-0000-4000-8000-000000000004';
  v_dir     uuid := 'a1000000-0000-4000-8000-000000000005';
BEGIN
  -- Sur le cloud, `auth.instances` peut être vide dans le SQL Editor → repli UUID nul (comportement GoTrue classique).
  SELECT id INTO v_inst FROM auth.instances LIMIT 1;
  IF v_inst IS NULL THEN
    v_inst := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Super admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_super) THEN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_super,
    v_inst,
    'authenticated',
    'authenticated',
    'demo-super-admin@effinor.local',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Démo Super Admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_super AND provider = 'email'
  ) THEN
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_super,
    v_super,
    jsonb_build_object('sub', v_super::text, 'email', 'demo-super-admin@effinor.local'),
    'email',
    v_super::text,
    now(),
    now(),
    now()
  );
  END IF;

  -- Agent commercial
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_agent) THEN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_agent,
    v_inst,
    'authenticated',
    'authenticated',
    'demo-agent@effinor.local',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Démo Agent commercial"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_agent AND provider = 'email'
  ) THEN
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_agent,
    v_agent,
    jsonb_build_object('sub', v_agent::text, 'email', 'demo-agent@effinor.local'),
    'email',
    v_agent::text,
    now(),
    now(),
    now()
  );
  END IF;

  -- Confirmateur
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_confirm) THEN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_confirm,
    v_inst,
    'authenticated',
    'authenticated',
    'demo-confirmeur@effinor.local',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Démo Confirmateur"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_confirm AND provider = 'email'
  ) THEN
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_confirm,
    v_confirm,
    jsonb_build_object('sub', v_confirm::text, 'email', 'demo-confirmeur@effinor.local'),
    'email',
    v_confirm::text,
    now(),
    now(),
    now()
  );
  END IF;

  -- Closer
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_closer) THEN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_closer,
    v_inst,
    'authenticated',
    'authenticated',
    'demo-closer@effinor.local',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Démo Closer"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_closer AND provider = 'email'
  ) THEN
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_closer,
    v_closer,
    jsonb_build_object('sub', v_closer::text, 'email', 'demo-closer@effinor.local'),
    'email',
    v_closer::text,
    now(),
    now(),
    now()
  );
  END IF;

  -- Directeur commercial
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_dir) THEN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_dir,
    v_inst,
    'authenticated',
    'authenticated',
    'demo-directeur@effinor.local',
    v_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Démo Directeur commercial"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_dir AND provider = 'email'
  ) THEN
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_dir,
    v_dir,
    jsonb_build_object('sub', v_dir::text, 'email', 'demo-directeur@effinor.local'),
    'email',
    v_dir::text,
    now(),
    now(),
    now()
  );
  END IF;
END $$;

-- Le trigger public.handle_new_user remplit public.profiles ; on aligne les noms
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

INSERT INTO public.user_roles (user_id, role_id)
SELECT p.id, r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email = 'demo-confirmeur@effinor.local' AND r.code = 'technician'
ON CONFLICT (user_id, role_id) DO NOTHING;

SELECT p.email, p.full_name, array_agg(r.code ORDER BY r.code) AS roles
FROM public.profiles p
JOIN public.user_roles ur ON ur.user_id = p.id
JOIN public.roles r ON r.id = ur.role_id
WHERE p.email LIKE 'demo-%@effinor.local'
GROUP BY p.id, p.email, p.full_name
ORDER BY p.email;
