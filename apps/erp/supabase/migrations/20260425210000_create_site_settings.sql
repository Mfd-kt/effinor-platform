-- Migration: table site_settings (key-value JSONB) + RLS
-- Date: 2026-04-25
-- Description: paramètres site public (contact, stats TrustBar) éditables depuis l'ERP.
--   * Lecture publique (anon) pour le site effinor.fr
--   * CRUD réservé super_admin, admin, marketing_manager
-- Pré-requis: public.current_user_has_role_code (cee_sheet_workflows)

BEGIN;

-- ============================================================
-- TABLE site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS
  'Clés: contact (JSON), stats (JSON array). Mis à jour depuis l''ERP marketing.';

CREATE OR REPLACE FUNCTION public.set_site_settings_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_site_settings_updated_at();

-- ============================================================
-- SEED (aligné sur apps/website/lib/site-config.ts + site-stats.ts)
-- ============================================================
INSERT INTO public.site_settings (key, value)
VALUES
  (
    'contact',
    '{
      "email": "contact@effinor.fr",
      "phone": "09 78 45 50 63",
      "phoneE164": "+33978455063",
      "address": {
        "street": "Tour Europa, Av. de l''Europe",
        "postalCode": "94320",
        "city": "Thiais",
        "country": "France",
        "full": "Tour Europa, Av. de l''Europe, 94320 Thiais"
      },
      "hours": {
        "label": "Lun-Ven : 8h-18h",
        "schema": [
          { "days": "Mo,Tu,We,Th,Fr", "opens": "08:00", "closes": "18:00" }
        ]
      }
    }'::jsonb
  ),
  (
    'stats',
    '[
      {
        "value": "2 500+",
        "label": "Chantiers réalisés",
        "description": "[TODO Moufdi] Nombre réel de chantiers"
      },
      {
        "value": "1 800 €",
        "label": "Économies moyennes/an",
        "description": "[TODO Moufdi] Économies réelles par foyer"
      },
      {
        "value": "4.7/5 ★",
        "label": "Note clients",
        "description": "[TODO Moufdi] Plateforme d''avis et nombre"
      },
      {
        "value": "RGE",
        "label": "QualiPAC · QualiPV · Qualibois",
        "description": "[TODO Moufdi] Confirmer certifications exactes"
      }
    ]'::jsonb
  )
ON CONFLICT (key) DO UPDATE
SET
  value      = EXCLUDED.value,
  updated_at = now();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select_public" ON public.site_settings;
CREATE POLICY "site_settings_select_public"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "site_settings_all_staff" ON public.site_settings;
CREATE POLICY "site_settings_all_staff"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('marketing_manager')
  )
  WITH CHECK (
    public.current_user_has_role_code('super_admin')
    OR public.current_user_has_role_code('admin')
    OR public.current_user_has_role_code('marketing_manager')
  );

-- Staff doit pouvoir lire toutes les lignes (déjà couvert par FOR ALL).

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

COMMIT;
