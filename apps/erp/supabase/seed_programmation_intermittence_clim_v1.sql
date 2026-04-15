-- =============================================================================
-- Template VT « Programmation intermittence climatisation »
--
-- Tables : technical_visit_templates, technical_visit_template_versions
-- (schéma : migration 20260428100000_technical_visit_templates_builder.sql)
--
-- Idempotent :
--   - master : insert si aucune ligne avec template_key = PROGRAMMATION_INTERMITTENCE_CLIM
--   - v1     : insert si aucune ligne (template_id, version_number = 1)
--
-- Version créée directement en statut published + published_at = now().
-- =============================================================================

INSERT INTO public.technical_visit_templates (
  template_key,
  label,
  description,
  cee_sheet_id,
  is_active
)
SELECT
  'PROGRAMMATION_INTERMITTENCE_CLIM',
  'Programmation intermittence climatisation',
  'Template de visite technique pour les opérations de programmation intermittente de climatisation.',
  NULL,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.technical_visit_templates t
  WHERE t.template_key = 'PROGRAMMATION_INTERMITTENCE_CLIM'
);

INSERT INTO public.technical_visit_template_versions (
  template_id,
  version_number,
  status,
  schema_json,
  published_at
)
SELECT
  t.id,
  1,
  'published',
$PROG_CLIM_SCHEMA$
{
  "version": 1,
  "template_key": "PROGRAMMATION_INTERMITTENCE_CLIM",
  "label": "Programmation intermittence climatisation",
  "sections": [
    {
      "id": "prospector_info",
      "title": "1. Informations du prospecteur",
      "order": 1,
      "fields": [
        {
          "id": "salesperson_name",
          "type": "text",
          "label": "Nom du commercial",
          "required": true,
          "order": 1
        },
        {
          "id": "company_name",
          "type": "text",
          "label": "Nom de l'établissement / Raison sociale",
          "required": true,
          "order": 2
        },
        {
          "id": "contact_full_name",
          "type": "text",
          "label": "Nom et prénom du contact rencontré",
          "required": true,
          "order": 3
        },
        {
          "id": "contact_role",
          "type": "radio",
          "label": "Fonction du contact",
          "required": true,
          "order": 4,
          "options": [
            { "value": "gerant", "label": "Gérant" },
            { "value": "directeur", "label": "Directeur" },
            { "value": "responsable_technique", "label": "Responsable technique" },
            { "value": "responsable_administratif", "label": "Responsable administratif" },
            { "value": "autre", "label": "Autre" }
          ]
        },
        {
          "id": "contact_phone",
          "type": "text",
          "label": "Numéro de téléphone",
          "required": true,
          "order": 5
        },
        {
          "id": "contact_email",
          "type": "text",
          "label": "Email du contact",
          "required": true,
          "order": 6
        }
      ]
    },
    {
      "id": "site_information",
      "title": "2. Informations du site",
      "order": 2,
      "fields": [
        {
          "id": "site_full_address",
          "type": "text",
          "label": "Adresse complète du site (adresse, code postal, ville)",
          "required": true,
          "order": 1
        },
        {
          "id": "dom_territory",
          "type": "radio",
          "label": "Territoire (DOM)",
          "required": true,
          "order": 2,
          "options": [
            { "value": "guadeloupe", "label": "Guadeloupe" },
            { "value": "martinique", "label": "Martinique" },
            { "value": "guyane", "label": "Guyane" },
            { "value": "la_reunion", "label": "La Réunion" },
            { "value": "mayotte", "label": "Mayotte" }
          ]
        },
        {
          "id": "site_geolocation",
          "type": "text",
          "label": "Géolocalisation du site",
          "required": true,
          "order": 3,
          "hint": "Cliquer pour vous localiser"
        },
        {
          "id": "submission_timestamp",
          "type": "text",
          "label": "Horodatage de soumission",
          "required": true,
          "order": 4
        },
        {
          "id": "site_activity_type",
          "type": "radio",
          "label": "Type d'activité du site",
          "required": true,
          "order": 5,
          "options": [
            { "value": "bureaux", "label": "Bureaux" },
            { "value": "commerce", "label": "Commerce" },
            { "value": "hotellerie", "label": "Hôtellerie" },
            { "value": "enseignement", "label": "Enseignement" },
            { "value": "sante", "label": "Santé" },
            { "value": "autres_tertiaires", "label": "Autres secteurs tertiaires" }
          ]
        },
        {
          "id": "building_age_eligibility",
          "type": "radio",
          "label": "Le bâtiment est dans le secteur tertiaire (...) et existe depuis plus de 2 ans",
          "required": true,
          "order": 6,
          "options": [
            { "value": "existing_over_2_years", "label": "Bâtiment existant > 2 ans" },
            { "value": "existing_under_2_years", "label": "Bâtiment existant < 2 ans" }
          ]
        },
        {
          "id": "control_system_scope",
          "type": "radio",
          "label": "Le site contient 1 système de pilotage pour chaque zone ou 1 système de pilotage centralisé qui commande l'ensemble des zones",
          "required": true,
          "order": 7,
          "options": [
            { "value": "one_per_zone", "label": "1 système de pilotage pour chaque zone" },
            { "value": "centralized", "label": "1 système de pilotage centralisé pour l'ensemble des zones" }
          ]
        },
        {
          "id": "cooling_groups",
          "type": "textarea",
          "label": "Groupe de froid (déclarer chaque groupe séparément)",
          "required": true,
          "order": 8,
          "hint": "Marque centrale frigorifique / groupe froid | Modèle..."
        },
        {
          "id": "electrical_panel_photo",
          "type": "photo",
          "label": "Photo tableau électrique, disjoncteur",
          "required": true,
          "order": 9,
          "min_files": 1,
          "max_files": 15
        }
      ]
    },
    {
      "id": "prospect_context_followup",
      "title": "3. Contexte et suivi du prospect",
      "order": 3,
      "fields": [
        {
          "id": "building_front_photo",
          "type": "photo",
          "label": "Photo de la façade de l'établissement",
          "required": true,
          "order": 1,
          "min_files": 1,
          "max_files": 10
        },
        {
          "id": "air_conditioning_system_photo",
          "type": "photo",
          "label": "Photo du système de climatisation (groupe froid, local technique...)",
          "required": true,
          "order": 2,
          "min_files": 1,
          "max_files": 15
        },
        {
          "id": "contact_interest_level",
          "type": "radio",
          "label": "Niveau d'intérêt du contact",
          "required": true,
          "order": 3,
          "options": [
            { "value": "tres_interesse", "label": "Très intéressé" },
            { "value": "interesse", "label": "Intéressé" },
            { "value": "indecis", "label": "Indécis" },
            { "value": "pas_interesse", "label": "Pas intéressé" },
            { "value": "absent_recontacter", "label": "Absent — à recontacter" }
          ]
        },
        {
          "id": "next_step",
          "type": "radio",
          "label": "Suite à donner",
          "required": true,
          "order": 4,
          "options": [
            { "value": "envoyer_documentation", "label": "Envoyer documentation" },
            { "value": "rappel_telephonique", "label": "Rappel téléphonique" },
            { "value": "rdv_a_planifier", "label": "RDV à planifier" },
            { "value": "dossier_a_monter", "label": "Dossier à monter" },
            { "value": "sans_suite", "label": "Sans suite" }
          ]
        },
        {
          "id": "free_notes",
          "type": "textarea",
          "label": "Remarques libres du prospecteur (objections, contexte, infos utiles, faisabilité, difficultés..)",
          "required": true,
          "order": 5
        }
      ]
    }
  ]
}
$PROG_CLIM_SCHEMA$::jsonb,
  now()
FROM public.technical_visit_templates t
WHERE t.template_key = 'PROGRAMMATION_INTERMITTENCE_CLIM'
  AND NOT EXISTS (
    SELECT 1
    FROM public.technical_visit_template_versions v
    WHERE v.template_id = t.id
      AND v.version_number = 1
  );

-- =============================================================================
-- Liaison fiche CEE (à activer manuellement après création / choix de la fiche)
-- =============================================================================
-- UPDATE public.cee_sheets
-- SET
--   requires_technical_visit = true,
--   technical_visit_template_key = 'PROGRAMMATION_INTERMITTENCE_CLIM',
--   technical_visit_template_version = 1,
--   updated_at = now()
-- WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
--   AND deleted_at IS NULL;
