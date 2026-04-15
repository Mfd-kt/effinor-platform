/**
 * Colonnes `cee_sheets` embarquées sur `lead_sheet_workflows` pour résolution VT dynamique
 * et affichage — garder aligné avec `resolveVisitTemplateForCeeSheet`.
 */
export const CEE_SHEET_WORKFLOW_EMBED =
  "id, code, label, simulator_key, workflow_key, is_commercial_active, requires_technical_visit, technical_visit_template_key, technical_visit_template_version";

/** Sous-ensemble pour chargement ciblé (ex. création VT depuis lead). */
export const CEE_SHEET_VISIT_TEMPLATE_RESOLUTION_FIELDS =
  "code, label, simulator_key, technical_visit_template_key, technical_visit_template_version";
