-- Aligner le stock existant sur la règle « prêt à contacter par défaut » (téléphone présent, hors fiches finies / doublons / rejet / déjà en cours côté commercial).
-- Les nouveaux imports sont recalculés côté app via computeLeadGenerationDispatchQueue + evaluate batch.

UPDATE public.lead_generation_stock lgs
SET
  dispatch_queue_status = 'ready_now',
  dispatch_queue_reason = 'Prêt à contacter (alignement règle par défaut).',
  dispatch_queue_evaluated_at = now(),
  dispatch_queue_rank = 5000000 + LEAST(100, GREATEST(0, COALESCE(lgs.commercial_score, 0)))::integer
WHERE lgs.converted_lead_id IS NULL
  AND lgs.duplicate_of_stock_id IS NULL
  AND COALESCE(lgs.qualification_status, '') IS DISTINCT FROM 'duplicate'
  AND COALESCE(lgs.qualification_status, '') IS DISTINCT FROM 'rejected'
  AND lgs.stock_status NOT IN (
    'rejected',
    'expired',
    'archived',
    'converted',
    'assigned',
    'in_progress'
  )
  AND (
    NULLIF(btrim(COALESCE(lgs.phone, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(lgs.normalized_phone, '')), '') IS NOT NULL
  )
  AND lgs.dispatch_queue_status IS DISTINCT FROM 'ready_now';
