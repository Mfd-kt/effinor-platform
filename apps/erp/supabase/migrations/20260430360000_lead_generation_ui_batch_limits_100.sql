-- Aligne les lots « actions rapides » UI sur 100 (les anciennes bases avaient 20 depuis l’étape 22).
UPDATE public.lead_generation_settings
SET
  value = jsonb_build_object(
    'quick_score_limit', 100,
    'quick_enrichment_limit', 100,
    'quick_dispatch_queue_limit', 100,
    'quick_recycling_limit', 100
  ),
  updated_at = now()
WHERE key = 'ui_batch_limits';
