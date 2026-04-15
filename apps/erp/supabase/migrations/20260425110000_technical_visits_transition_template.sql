-- =============================================================================
-- Visites techniques — transition : template dynamique, cycle terrain, unicité
-- =============================================================================
-- Doctrine (conteneur de transition, pas modèle final) :
-- - Les colonnes legacy (terrain, texte, photos structurées historiques) restent
--   source et historique.
-- - form_answers_json devient la source des réponses des futurs templates dynamiques.
-- - Pendant la transition, des valeurs pourront être recopiées entre legacy et
--   form_answers_json.
-- - À terme, certaines colonnes legacy pourront être dérivées ou dépréciées.
-- =============================================================================

COMMENT ON TABLE public.technical_visits IS
'Conteneur de transition : colonnes legacy = source/historique ; form_answers_json = source des '
'réponses templates dynamiques ; recopie possible entre les deux pendant la migration ; à terme, '
'certaines colonnes legacy pourront être dérivées ou dépréciées.';

-- Template (NULL = pas de moteur dynamique / legacy)
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS visit_template_key text,
  ADD COLUMN IF NOT EXISTS visit_template_version integer,
  ADD COLUMN IF NOT EXISTS visit_schema_snapshot_json jsonb;

COMMENT ON COLUMN public.technical_visits.visit_template_key IS
'Clé applicative du gabarit (ex. BAT-TH-142). NULL = sans template dynamique.';
COMMENT ON COLUMN public.technical_visits.visit_template_version IS
'Version du gabarit au moment de l’association. NULL si et seulement si visit_template_key est NULL.';
COMMENT ON COLUMN public.technical_visits.visit_schema_snapshot_json IS
'Snapshot figé du schéma de formulaire. NULL = legacy ou snapshot pas encore posé (distinct d’un objet vide).';

-- Réponses dynamiques
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS form_answers_json jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.technical_visits.form_answers_json IS
'Réponses au template dynamique (clés stables). {} = aucune réponse encore ; colonnes legacy restent en parallèle.';

-- Cycle terrain / accès / verrou
ALTER TABLE public.technical_visits
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.technical_visits.started_at IS 'Début effectif terrain / saisie.';
COMMENT ON COLUMN public.technical_visits.completed_at IS 'Fin de saisie métier (distinct de performed_at legacy si besoin).';
COMMENT ON COLUMN public.technical_visits.access_granted_at IS 'Ouverture d’accès technicien (audit / mobile).';
COMMENT ON COLUMN public.technical_visits.locked_at IS 'Fiche verrouillée ; saisie bloquée sauf dérogation.';
COMMENT ON COLUMN public.technical_visits.locked_by IS 'Profil ayant posé le verrou.';

-- Cohérence : pas de version « fantôme » sans clé, et inversement
ALTER TABLE public.technical_visits
  DROP CONSTRAINT IF EXISTS technical_visits_template_key_version_pair;

ALTER TABLE public.technical_visits
  ADD CONSTRAINT technical_visits_template_key_version_pair CHECK (
    (visit_template_key IS NULL AND visit_template_version IS NULL)
    OR (
      visit_template_key IS NOT NULL
      AND length(trim(visit_template_key)) > 0
      AND visit_template_version IS NOT NULL
    )
  );

-- Statuts « actifs » pour unicité partielle : pas validated / refused / cancelled
-- (validated = cycle métier terminé → nouvelle VT possible sur le même workflow).
CREATE UNIQUE INDEX IF NOT EXISTS technical_visits_one_active_per_workflow
  ON public.technical_visits (workflow_id)
  WHERE workflow_id IS NOT NULL
    AND deleted_at IS NULL
    AND status IN ('to_schedule', 'scheduled', 'performed', 'report_pending');

CREATE UNIQUE INDEX IF NOT EXISTS technical_visits_one_active_per_lead_legacy
  ON public.technical_visits (lead_id)
  WHERE workflow_id IS NULL
    AND deleted_at IS NULL
    AND status IN ('to_schedule', 'scheduled', 'performed', 'report_pending');
