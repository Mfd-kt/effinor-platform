-- Assouplir le plancher score pour la file de dispatch (alignement code : diffusion sans enrichissement complet).
UPDATE public.lead_generation_settings
SET value = value || '{"score_enrich_floor": 0}'::jsonb,
    updated_at = now()
WHERE key = 'dispatch_queue_rules';
