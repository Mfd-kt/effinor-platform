-- =============================================================================
-- Migration 1 — Extensions B2B/B2C + lead_type + display_name + audit CRM
-- Pattern transactionnel : INSERT extension active (archived_at NULL) possible
-- pendant leads.lead_type = 'unknown', puis UPDATE leads.lead_type (voir COMMENT
-- sur les fonctions trigger des extensions).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A. ENUMs (idempotent)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_type'
  ) THEN
    CREATE TYPE public.lead_type AS ENUM ('unknown', 'b2c', 'b2b');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_property_type'
  ) THEN
    CREATE TYPE public.lead_property_type AS ENUM ('maison', 'appartement', 'immeuble');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_periode_construction'
  ) THEN
    CREATE TYPE public.lead_periode_construction AS ENUM ('avant_2000', 'apres_2000');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_dpe_class'
  ) THEN
    CREATE TYPE public.lead_dpe_class AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'inconnu');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_age_logement'
  ) THEN
    CREATE TYPE public.lead_age_logement AS ENUM ('moins_15_ans', 'plus_15_ans');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_tranche_revenu'
  ) THEN
    CREATE TYPE public.lead_tranche_revenu AS ENUM (
      'tres_modeste', 'modeste', 'intermediaire', 'superieur'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_profil_occupant'
  ) THEN
    CREATE TYPE public.lead_profil_occupant AS ENUM (
      'proprietaire_occupant', 'bailleur', 'sci', 'locataire'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'lead_patrimoine_type'
  ) THEN
    CREATE TYPE public.lead_patrimoine_type AS ENUM ('appartements', 'maisons', 'mixte');
  END IF;
END$$;

COMMENT ON TYPE public.lead_type IS
  'Discriminant CRM : inconnu (qualification), B2C, B2B. Les extensions leads_b2b / leads_b2c peuvent coexister (ex. SCI résidentielle).';

-- -----------------------------------------------------------------------------
-- B. ALTER public.leads
-- -----------------------------------------------------------------------------

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_type public.lead_type NOT NULL DEFAULT 'unknown';

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS display_name text;

COMMENT ON COLUMN public.leads.worksite_address IS
  'Adresse du site principal : en B2C = logement du particulier ; en B2B = adresse du chantier (souvent distincte du siège social, dans public.leads_b2b).';

COMMENT ON COLUMN public.leads.sim_payload_json IS
  'DEPRECATED — snapshot JSON historique. Strangler : le nouveau code doit écrire dans leads_b2c.sim_residentiel_payload et leads_b2b.sim_destratification_payload. Cible suppression ~6 mois après stabilisation des extensions B2B/B2C.';

-- -----------------------------------------------------------------------------
-- C. CREATE TABLE public.leads_b2b
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leads_b2b (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  archived_at timestamptz,

  company_name text NOT NULL,
  siret text,
  head_office_siret text,
  worksite_siret text,
  head_office_address text NOT NULL DEFAULT '',
  head_office_postal_code text NOT NULL DEFAULT '',
  head_office_city text NOT NULL DEFAULT '',

  building_type text,
  heated_building boolean,
  warehouse_count integer,

  contact_role text,
  job_title text,
  department text,

  heating_mode_b2b text[] NOT NULL DEFAULT '{}'::text[],

  sim_destratification_payload jsonb NOT NULL DEFAULT '{}'::jsonb,

  sim_height_m numeric(10, 2),
  sim_surface_m2 numeric(14, 2),
  sim_client_type text,
  sim_model text,
  sim_heating_mode text,
  sim_consigne text,
  sim_volume_m3 numeric(16, 2),
  sim_air_change_rate numeric(10, 4),
  sim_model_capacity_m3h numeric(16, 2),
  sim_needed_destrat integer,
  sim_power_kw numeric(16, 4),
  sim_consumption_kwh_year numeric(16, 2),
  sim_cost_year_min numeric(16, 2),
  sim_cost_year_max numeric(16, 2),
  sim_cost_year_selected numeric(16, 2),
  sim_saving_kwh_30 numeric(16, 2),
  sim_saving_eur_30_min numeric(16, 2),
  sim_saving_eur_30_max numeric(16, 2),
  sim_saving_eur_30_selected numeric(16, 2),
  sim_co2_saved_tons numeric(16, 4),
  sim_cee_prime_estimated numeric(16, 2),
  sim_install_unit_price numeric(16, 2),
  sim_install_total_price numeric(16, 2),
  sim_rest_to_charge numeric(16, 2),
  sim_lead_score integer,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leads_b2b IS
  'Extension B2B : plusieurs lignes par lead_id (historique). Au plus une ligne active (archived_at IS NULL) par lead_id. '
  'Peut coexister avec leads_b2c active (SCI bailleur résidentiel). '
  'Réactivation d''une ligne archivée : si plusieurs lignes archivées existent pour un même lead_id, l''application doit choisir la bonne (souvent la plus récente par created_at) — voir spec Server Action Phase 2.3.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_b2b_one_active
  ON public.leads_b2b (lead_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_b2b_lead_id_archived
  ON public.leads_b2b (lead_id, archived_at);

-- -----------------------------------------------------------------------------
-- D. CREATE TABLE public.leads_b2c
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leads_b2c (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  archived_at timestamptz,

  property_type public.lead_property_type,
  periode_construction public.lead_periode_construction,
  dpe_class public.lead_dpe_class,
  age_logement public.lead_age_logement,
  nb_personnes integer,
  tranche_revenu public.lead_tranche_revenu,
  profil_occupant public.lead_profil_occupant,

  raison_sociale_sci text,
  patrimoine_type public.lead_patrimoine_type,
  nb_logements integer,
  surface_totale_m2 numeric(14, 2),

  ite_iti_recente boolean,
  fenetres text,
  sous_sol boolean,
  btd_installe boolean,
  vmc_installee boolean,
  chauffage_24_mois boolean,
  travaux_cee_recus text,

  heating_mode_b2c text[] NOT NULL DEFAULT '{}'::text[],

  sim_residentiel_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sim_residentiel_result jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leads_b2c IS
  'Extension B2C : plusieurs lignes par lead_id (historique). Au plus une ligne active (archived_at IS NULL) par lead_id. '
  'Une leads_b2c active peut coexister avec une leads_b2b active pour le même lead_id lorsque leads.lead_type = ''b2b'' (SCI bailleur résidentiel) ; cette coexistence est facultative (B2B tertiaire pur sans leads_b2c). '
  'Archiver leads_b2c sur un lead B2B SCI ne viole pas l''invariant principal : lead_type = ''b2b'' n''exige qu''une leads_b2b active, pas de leads_b2c.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_b2c_one_active
  ON public.leads_b2c (lead_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_b2c_lead_id_archived
  ON public.leads_b2c (lead_id, archived_at);

-- -----------------------------------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS set_leads_b2b_updated_at ON public.leads_b2b;
CREATE TRIGGER set_leads_b2b_updated_at
  BEFORE UPDATE ON public.leads_b2b
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_leads_b2c_updated_at ON public.leads_b2c;
CREATE TRIGGER set_leads_b2c_updated_at
  BEFORE UPDATE ON public.leads_b2c
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- E. Index lecture leads
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON public.leads (lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_display_name ON public.leads (display_name);

-- -----------------------------------------------------------------------------
-- F. Cohérence lead_type ↔ extensions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_leads_enforce_extension_for_lead_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_b2b boolean;
  has_b2c boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.lead_type IS NOT DISTINCT FROM OLD.lead_type THEN
    RETURN NEW;
  END IF;

  IF NEW.lead_type = 'unknown' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.leads_b2b b
    WHERE b.lead_id = NEW.id AND b.archived_at IS NULL
  ) INTO has_b2b;

  SELECT EXISTS (
    SELECT 1 FROM public.leads_b2c c
    WHERE c.lead_id = NEW.id AND c.archived_at IS NULL
  ) INTO has_b2c;

  IF NEW.lead_type = 'b2b' AND NOT has_b2b THEN
    RAISE EXCEPTION 'lead_type=b2b requires an active leads_b2b row (archived_at IS NULL) for lead_id=%', NEW.id;
  END IF;

  IF NEW.lead_type = 'b2c' AND NOT has_b2c THEN
    RAISE EXCEPTION 'lead_type=b2c requires an active leads_b2c row (archived_at IS NULL) for lead_id=%', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_enforce_extension_for_lead_type ON public.leads;
CREATE TRIGGER leads_enforce_extension_for_lead_type
  BEFORE UPDATE OF lead_type ON public.leads
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_leads_enforce_extension_for_lead_type();

COMMENT ON FUNCTION public.trg_leads_enforce_extension_for_lead_type() IS
  'Sur UPDATE de leads.lead_type : si le type devient b2b (resp. b2c), impose une ligne leads_b2b (resp. leads_b2c) active. '
  'unknown : aucune contrainte d''extension. b2b n''exige pas leads_b2c (SCI optionnelle).';

CREATE OR REPLACE FUNCTION public.trg_leads_b2b_enforce_lead_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lt public.lead_type;
BEGIN
  IF NEW.archived_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT l.lead_type INTO lt FROM public.leads l WHERE l.id = NEW.lead_id;
  IF lt IS NULL THEN
    RAISE EXCEPTION 'lead_id % not found', NEW.lead_id;
  END IF;

  IF lt NOT IN ('b2b', 'unknown') THEN
    RAISE EXCEPTION
      'Cannot activate leads_b2b unless leads.lead_type IN (b2b, unknown) (lead_id=%, current=%)',
      NEW.lead_id, lt;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_leads_b2b_enforce_lead_type() IS
  'Vérifie qu''une ligne leads_b2b active (archived_at IS NULL) n''est posée que si leads.lead_type IN (''b2b'', ''unknown''). '
  'Le cas ''unknown'' est intentionnel : permet le pattern transactionnel INSERT extension active PUIS UPDATE leads.lead_type = ''b2b'' dans la même transaction. '
  'La cohérence finale (b2b ⇒ extension B2B active) est garantie par trg_leads_enforce_extension_for_lead_type. '
  'Le passage à b2c n''archive pas automatiquement leads_b2b ; l''application doit archiver manuellement si nécessaire ; '
  'toute incohérence b2c sans leads_b2c active est bloquée côté leads.';

CREATE OR REPLACE FUNCTION public.trg_leads_b2c_enforce_lead_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lt public.lead_type;
BEGIN
  IF NEW.archived_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT l.lead_type INTO lt FROM public.leads l WHERE l.id = NEW.lead_id;
  IF lt IS NULL THEN
    RAISE EXCEPTION 'lead_id % not found', NEW.lead_id;
  END IF;

  IF lt NOT IN ('b2c', 'b2b', 'unknown') THEN
    RAISE EXCEPTION
      'Cannot activate leads_b2c unless leads.lead_type IN (b2c, b2b, unknown) (lead_id=%, current=%)',
      NEW.lead_id, lt;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_leads_b2c_enforce_lead_type() IS
  'Vérifie qu''une ligne leads_b2c active (archived_at IS NULL) n''est posée que si leads.lead_type IN (''b2c'', ''b2b'', ''unknown''). '
  'Le cas ''unknown'' permet INSERT extension active puis UPDATE leads.lead_type = ''b2c''. '
  'Le cas ''b2b'' autorise la coexistence SCI résidentielle (leads_b2b + leads_b2c actives). '
  'La cohérence finale (b2c ⇒ extension B2C active) est garantie par trg_leads_enforce_extension_for_lead_type.';

DROP TRIGGER IF EXISTS leads_b2b_enforce_lead_type ON public.leads_b2b;
CREATE TRIGGER leads_b2b_enforce_lead_type
  BEFORE INSERT OR UPDATE OF archived_at, lead_id ON public.leads_b2b
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_leads_b2b_enforce_lead_type();

DROP TRIGGER IF EXISTS leads_b2c_enforce_lead_type ON public.leads_b2c;
CREATE TRIGGER leads_b2c_enforce_lead_type
  BEFORE INSERT OR UPDATE OF archived_at, lead_id ON public.leads_b2c
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_leads_b2c_enforce_lead_type();

-- -----------------------------------------------------------------------------
-- G. Propagation Realtime (toucher leads.updated_at)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_propagate_extension_change_to_leads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET updated_at = now()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_propagate_extension_change_to_leads() IS
  'Après INSERT/UPDATE sur leads_b2b ou leads_b2c : met leads.updated_at à now() pour le client abonné au realtime sur public.leads.';

DROP TRIGGER IF EXISTS leads_b2b_propagate_to_leads ON public.leads_b2b;
CREATE TRIGGER leads_b2b_propagate_to_leads
  AFTER INSERT OR UPDATE ON public.leads_b2b
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_propagate_extension_change_to_leads();

DROP TRIGGER IF EXISTS leads_b2c_propagate_to_leads ON public.leads_b2c;
CREATE TRIGGER leads_b2c_propagate_to_leads
  AFTER INSERT OR UPDATE ON public.leads_b2c
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_propagate_extension_change_to_leads();

-- -----------------------------------------------------------------------------
-- H. RLS (alignement leads_all_active : is_active_profile + lead visible)
-- -----------------------------------------------------------------------------

ALTER TABLE public.leads_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_b2c ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_b2b_all_active" ON public.leads_b2b;
CREATE POLICY "leads_b2b_all_active"
  ON public.leads_b2b FOR ALL TO authenticated
  USING (
    public.is_active_profile()
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = leads_b2b.lead_id)
  )
  WITH CHECK (
    public.is_active_profile()
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = leads_b2b.lead_id)
  );

DROP POLICY IF EXISTS "leads_b2c_all_active" ON public.leads_b2c;
CREATE POLICY "leads_b2c_all_active"
  ON public.leads_b2c FOR ALL TO authenticated
  USING (
    public.is_active_profile()
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = leads_b2c.lead_id)
  )
  WITH CHECK (
    public.is_active_profile()
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = leads_b2c.lead_id)
  );

-- -----------------------------------------------------------------------------
-- I.0 Auto-fill trigger sur leads.display_name
--
-- Garantit que tous les chemins d'INSERT existants (formulaire ERP, simulateur
-- public website, RPC convert_lead_generation_assignment_to_lead, et tout futur
-- chemin) restent valides malgré le NOT NULL ajouté en I.2.
--
-- Le trigger applique la même formule que le backfill :
-- priorité au nom de personne, fallback raison sociale, ultime fallback
-- 'Lead sans nom'.
--
-- À garder en place comme filet de sécurité long-terme : protège contre tout
-- futur chemin d'insert qu'on aurait oublié de patcher côté TS.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_leads_set_display_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.display_name IS NULL OR length(trim(NEW.display_name)) = 0 THEN
    NEW.display_name := COALESCE(
      NULLIF(trim(concat_ws(' ', nullif(trim(NEW.first_name), ''), nullif(trim(NEW.last_name), ''))), ''),
      NULLIF(trim(NEW.company_name), ''),
      'Lead sans nom'
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trg_leads_set_display_name() IS
  'Auto-remplit leads.display_name si NULL ou vide. '
  'Filet de sécurité pour les chemins d''INSERT historiques '
  '(insertFromLeadForm, simulateur website, RPC convert_lead_generation) '
  'qui n''envoient pas explicitement display_name. '
  'Formule identique au backfill : nom personne > raison sociale > "Lead sans nom".';

DROP TRIGGER IF EXISTS leads_set_display_name ON public.leads;
CREATE TRIGGER leads_set_display_name
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE PROCEDURE public.trg_leads_set_display_name();

-- -----------------------------------------------------------------------------
-- I.1 Backfill display_name (données existantes)
-- -----------------------------------------------------------------------------

UPDATE public.leads
SET display_name = COALESCE(
  NULLIF(trim(concat_ws(' ', nullif(trim(first_name), ''), nullif(trim(last_name), ''))), ''),
  NULLIF(trim(company_name), ''),
  'Lead sans nom'
)
WHERE display_name IS NULL;

-- -----------------------------------------------------------------------------
-- I.2 NOT NULL sur display_name
-- -----------------------------------------------------------------------------

ALTER TABLE public.leads
  ALTER COLUMN display_name SET NOT NULL;

-- -----------------------------------------------------------------------------
-- J. Backfill leads_b2b archivée (préservation données B2B existantes sur leads)
-- -----------------------------------------------------------------------------

-- Prod peut être en retard sur la migration historique 20260401210000 : si
-- heating_type est encore "text", COALESCE(l.heating_type, '{}'::text[]) échoue
-- (42804). On aligne le type avant le SELECT de backfill.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'leads'
      AND c.column_name = 'heating_type'
      AND c.data_type = 'text'
  ) THEN
    ALTER TABLE public.leads
      ALTER COLUMN heating_type TYPE text[]
      USING (
        CASE
          WHEN heating_type IS NULL OR btrim(heating_type::text) = '' THEN NULL
          ELSE ARRAY[btrim(heating_type::text)]::text[]
        END
      );
  END IF;
END$$;

INSERT INTO public.leads_b2b (
  lead_id,
  archived_at,
  company_name,
  siret,
  head_office_siret,
  worksite_siret,
  head_office_address,
  head_office_postal_code,
  head_office_city,
  building_type,
  heated_building,
  warehouse_count,
  contact_role,
  job_title,
  department,
  heating_mode_b2b,
  sim_destratification_payload,
  sim_height_m,
  sim_surface_m2,
  sim_client_type,
  sim_model,
  sim_heating_mode,
  sim_consigne,
  sim_volume_m3,
  sim_air_change_rate,
  sim_model_capacity_m3h,
  sim_needed_destrat,
  sim_power_kw,
  sim_consumption_kwh_year,
  sim_cost_year_min,
  sim_cost_year_max,
  sim_cost_year_selected,
  sim_saving_kwh_30,
  sim_saving_eur_30_min,
  sim_saving_eur_30_max,
  sim_saving_eur_30_selected,
  sim_co2_saved_tons,
  sim_cee_prime_estimated,
  sim_install_unit_price,
  sim_install_total_price,
  sim_rest_to_charge,
  sim_lead_score
)
SELECT
  l.id,
  now(),
  COALESCE(NULLIF(trim(l.company_name), ''), l.display_name),
  l.siret,
  l.head_office_siret,
  l.worksite_siret,
  COALESCE(l.head_office_address, ''),
  COALESCE(l.head_office_postal_code, ''),
  COALESCE(l.head_office_city, ''),
  l.building_type,
  l.heated_building,
  l.warehouse_count,
  l.contact_role,
  l.job_title,
  l.department,
  COALESCE(l.heating_type, '{}'::text[]),
  '{}'::jsonb,
  l.sim_height_m,
  l.sim_surface_m2,
  l.sim_client_type,
  l.sim_model,
  l.sim_heating_mode,
  l.sim_consigne,
  l.sim_volume_m3,
  l.sim_air_change_rate,
  l.sim_model_capacity_m3h,
  l.sim_needed_destrat,
  l.sim_power_kw,
  l.sim_consumption_kwh_year,
  l.sim_cost_year_min,
  l.sim_cost_year_max,
  l.sim_cost_year_selected,
  l.sim_saving_kwh_30,
  l.sim_saving_eur_30_min,
  l.sim_saving_eur_30_max,
  l.sim_saving_eur_30_selected,
  l.sim_co2_saved_tons,
  l.sim_cee_prime_estimated,
  l.sim_install_unit_price,
  l.sim_install_total_price,
  l.sim_rest_to_charge,
  l.sim_lead_score
FROM public.leads l
WHERE l.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.leads_b2b b WHERE b.lead_id = l.id);

-- -----------------------------------------------------------------------------
-- K. Audit CRM par lead_id
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lead_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_activity_events_type_nonempty CHECK (length(trim(event_type)) > 0),
  CONSTRAINT lead_activity_events_metadata_is_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_events_lead_created
  ON public.lead_activity_events (lead_id, created_at DESC);

COMMENT ON TABLE public.lead_activity_events IS
  'Journal CRM par lead_id (conversions B2B/B2C, etc.), distinct de lead_sheet_workflow_events (tunnel CEE par workflow).';

ALTER TABLE public.lead_activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_activity_events_all_active" ON public.lead_activity_events;
CREATE POLICY "lead_activity_events_all_active"
  ON public.lead_activity_events FOR ALL TO authenticated
  USING (
    public.is_active_profile()
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activity_events.lead_id)
  )
  WITH CHECK (
    public.is_active_profile()
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_activity_events.lead_id)
  );

COMMIT;
