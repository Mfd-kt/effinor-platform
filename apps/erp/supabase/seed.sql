-- =============================================================================
-- Effinor ERP — seed (rôles + comptes de test locaux)
-- Exécuté après les migrations : `supabase db reset` ou `supabase db seed`
--
-- COMPTES DE CONNEXION (local / dev uniquement — ne pas réutiliser en prod)
-- -----------------------------------------------------------------------------
-- | Email                          | Mot de passe           | Rôle app (RBAC) |
-- |--------------------------------|------------------------|-----------------|
-- | admin@effinor.local            | ChangeMe!Effinor2026   | super_admin     |
-- | demo-super-admin@effinor.local | DemoEffinor2026!     | super_admin     |
-- -----------------------------------------------------------------------------
--
-- Si la connexion échoue :
--   • Vérifiez d’utiliser exactement l’email + mot de passe du tableau (sensible à la casse).
--   • L’app doit pointer vers la MÊME base que celle où le seed a tourné (.env.local = Supabase local).
--   • instance_id : COALESCE(auth.instances, '00000000-…') — si la table instances est vide (cas fréquent
--     sur le cloud dans l’éditeur SQL), on retombe sur l’UUID nul attendu par GoTrue.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Rôles métier (legacy + labels — les codes RBAC viennent aussi des migrations)
-- -----------------------------------------------------------------------------
INSERT INTO public.roles (code, label_fr) VALUES
  ('admin', 'Administrateur'),
  ('director', 'Direction'),
  ('sales', 'Commercial'),
  ('technical', 'Technique'),
  ('confirmer', 'Confirmeur')
ON CONFLICT (code) DO UPDATE SET label_fr = EXCLUDED.label_fr;

-- -----------------------------------------------------------------------------
-- 1) admin@effinor.local
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_encrypted_pw text := crypt('ChangeMe!Effinor2026', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id) THEN
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
    ) VALUES (
      v_admin_id,
      COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
      'authenticated',
      'authenticated',
      'admin@effinor.local',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Administrateur Effinor"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_admin_id
      AND provider = 'email'
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
    ) VALUES (
      v_admin_id,
      v_admin_id,
      jsonb_build_object(
        'sub', v_admin_id::text,
        'email', 'admin@effinor.local',
        'email_verified', true
      ),
      'email',
      v_admin_id::text,
      now(),
      now(),
      now()
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2) demo-super-admin@effinor.local (même rôle RBAC, second compte de démo)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_super_demo_id uuid := 'a1000000-0000-4000-8000-000000000001'::uuid;
  v_encrypted_pw text := crypt('DemoEffinor2026!', gen_salt('bf'));
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_super_demo_id) THEN
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
    ) VALUES (
      v_super_demo_id,
      COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
      'authenticated',
      'authenticated',
      'demo-super-admin@effinor.local',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Démo Super Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_super_demo_id
      AND provider = 'email'
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
    ) VALUES (
      v_super_demo_id,
      v_super_demo_id,
      jsonb_build_object(
        'sub', v_super_demo_id::text,
        'email', 'demo-super-admin@effinor.local',
        'email_verified', true
      ),
      'email',
      v_super_demo_id::text,
      now(),
      now(),
      now()
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Rôles applicatifs (codes alignés sur lib/auth/role-codes.ts + migration RBAC)
-- -----------------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.id = 'a0000000-0000-4000-8000-000000000001'::uuid
  AND r.code = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.id = 'a1000000-0000-4000-8000-000000000001'::uuid
  AND r.code = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.id = 'a0000000-0000-4000-8000-000000000001'::uuid
  AND r.code = 'technician'
ON CONFLICT (user_id, role_id) DO NOTHING;

UPDATE public.profiles
SET full_name = 'Administrateur Effinor'
WHERE id = 'a0000000-0000-4000-8000-000000000001'::uuid;

UPDATE public.profiles
SET full_name = 'Démo Super Admin'
WHERE id = 'a1000000-0000-4000-8000-000000000001'::uuid;

-- -----------------------------------------------------------------------------
-- Réparation : si les comptes avaient été créés avec un mauvais instance_id
-- (ex. UUID tout à zéro alors que le projet cloud a un autre id), la connexion échoue.
-- -----------------------------------------------------------------------------
UPDATE auth.users u
SET instance_id = COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid)
WHERE u.email IN ('admin@effinor.local', 'demo-super-admin@effinor.local')
  AND u.instance_id
    IS DISTINCT FROM COALESCE((SELECT id FROM auth.instances LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid);
