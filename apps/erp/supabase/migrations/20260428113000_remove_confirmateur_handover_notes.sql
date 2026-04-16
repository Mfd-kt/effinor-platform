-- Nettoyage des champs supprimés de la qualification confirmateur.
-- Ces clés ne sont plus utilisées côté produit.

UPDATE public.lead_sheet_workflows
SET qualification_data_json =
  (
    COALESCE(qualification_data_json, '{}'::jsonb)
    - 'confirmateur_notes'
    - 'closer_handover_notes'
  ),
  updated_at = now()
WHERE qualification_data_json IS NOT NULL
  AND (
    qualification_data_json ? 'confirmateur_notes'
    OR qualification_data_json ? 'closer_handover_notes'
  );
