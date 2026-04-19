-- Retrait de l’automatisation LinkedIn via Apify : suppression des journaux d’import dédiés.
-- Les fiches stock conservent leurs champs linkedin_url / has_linkedin (autres sources ou saisie manuelle).

DELETE FROM public.lead_generation_import_batches
WHERE source = 'apify_linkedin_enrichment';
