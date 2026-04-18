-- Étape 8 lead-generation : suivi asynchrone des imports Apify (run / dataset / erreur).
-- Colonnes nullable pour ne pas casser les batches existants (CSV, scripts, etc.).

ALTER TABLE public.lead_generation_import_batches
  ADD COLUMN IF NOT EXISTS external_run_id text,
  ADD COLUMN IF NOT EXISTS external_dataset_id text,
  ADD COLUMN IF NOT EXISTS external_status text,
  ADD COLUMN IF NOT EXISTS error_summary text,
  ADD COLUMN IF NOT EXISTS ingest_started_at timestamptz;

COMMENT ON COLUMN public.lead_generation_import_batches.external_run_id IS
  'Identifiant du run côté fournisseur externe (ex. Apify actor run id).';
COMMENT ON COLUMN public.lead_generation_import_batches.external_dataset_id IS
  'Identifiant du dataset par défaut associé au run (ex. Apify defaultDatasetId).';
COMMENT ON COLUMN public.lead_generation_import_batches.external_status IS
  'Dernier statut connu côté fournisseur (ex. RUNNING, SUCCEEDED).';
COMMENT ON COLUMN public.lead_generation_import_batches.error_summary IS
  'Résumé d’erreur import / Apify / ingestion (texte court).';
COMMENT ON COLUMN public.lead_generation_import_batches.ingest_started_at IS
  'Horodatage de prise en charge de l’ingestion (idempotence sync → ingest).';

CREATE INDEX IF NOT EXISTS idx_lead_generation_import_batches_external_run_id
  ON public.lead_generation_import_batches (external_run_id)
  WHERE external_run_id IS NOT NULL;
