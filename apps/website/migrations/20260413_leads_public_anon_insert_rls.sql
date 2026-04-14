-- ============================================================================
-- RLS : permettre l'INSERT public sur public.leads (mini-formulaire, /contact)
-- ============================================================================
-- Erreur typique sans policy adaptée : 42501 — new row violates row-level
-- security policy for table "leads"
--
-- Le front insère avec un `id` UUID généré côté client (pas de `.select()` après
-- insert), donc aucune policy SELECT pour `anon` n’est requise pour récupérer l’id.
--
-- Où l’exécuter : Supabase Dashboard → le même projet que l’URL dans
-- VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL du build déployé sur effinor.fr
-- → SQL Editor → Run.
--
-- Vérification (résultat attendu : au moins une ligne cmd = INSERT, roles = {public}) :
--   SELECT policyname, permissive, roles, cmd, with_check::text
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'leads'
--   ORDER BY cmd, policyname;
-- ============================================================================
-- Si l’erreur persiste après ce script : une policy RESTRICTIVE sur INSERT
-- impose que *toutes* ses clauses WITH CHECK passent ; une seule condition du
-- type auth.uid() IS NOT NULL bloque les visiteurs anonymes.
-- Le bloc ci-dessous supprime les policies RESTRICTIVE ciblant INSERT (ou ALL)
-- sur public.leads. Vérifiez ensuite dans le Dashboard que c’est acceptable.
-- ============================================================================

DO $$
DECLARE
 r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leads'
      AND permissive = 'RESTRICTIVE'
      AND (cmd = 'INSERT' OR cmd = 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', r.policyname);
    RAISE NOTICE 'Dropped restrictive policy: %', r.policyname;
  END LOOP;
END $$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON TABLE public.leads TO anon, authenticated;

-- Cible explicite anon + authenticated (noms de rôles Supabase)
DROP POLICY IF EXISTS "Allow anonymous insert on leads" ON public.leads;
CREATE POLICY "Allow anonymous insert on leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- PUBLIC = tous les rôles (couvre les cas où le JWT / rôle effectif n’est pas listé ci-dessus)
DROP POLICY IF EXISTS "Allow insert on leads for public role" ON public.leads;
CREATE POLICY "Allow insert on leads for public role"
ON public.leads
FOR INSERT
TO PUBLIC
WITH CHECK (true);
