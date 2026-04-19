-- Comptage des fiches lead-gen « actives » (file agent) pour un couple (agent, fiche CEE),
-- via stock.import_batch → lead_generation_import_batches.cee_sheet_id.

CREATE OR REPLACE FUNCTION public.count_lead_generation_agent_active_stock_for_cee_sheet(
  p_agent_id uuid,
  p_cee_sheet_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.lead_generation_assignments a
  INNER JOIN public.lead_generation_stock s ON s.id = a.stock_id
  INNER JOIN public.lead_generation_import_batches b ON b.id = s.import_batch_id
  WHERE a.agent_id = p_agent_id
    AND a.assignment_status IN ('assigned', 'opened', 'in_progress')
    AND a.outcome = 'pending'
    AND b.cee_sheet_id = p_cee_sheet_id;
$$;

COMMENT ON FUNCTION public.count_lead_generation_agent_active_stock_for_cee_sheet(uuid, uuid) IS
  'Nombre d’assignations actives (pending) de l’agent sur du stock rattaché à une fiche CEE donnée.';

GRANT EXECUTE ON FUNCTION public.count_lead_generation_agent_active_stock_for_cee_sheet(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_lead_generation_agent_active_stock_for_cee_sheet(uuid, uuid) TO service_role;
