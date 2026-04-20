import type { AppRoleCode } from "@/lib/auth/role-codes";

/**
 * Texte d’aide pour l’écran « Rôles et permissions » (aligné sur le code métier actuel).
 */
export const ROLE_PERMISSIONS_SUMMARY_FR: Record<AppRoleCode, string> = {
  super_admin:
    "Accès complet, création de comptes, référentiels CEE et paramètres système réservés à ce rôle.",
  admin:
    "Vue large sur les données commerciales (leads, bénéficiaires) ; pas les réglages système réservés au super administrateur.",
  sales_agent:
    "Leads dont l’utilisateur est l’agent créateur ; tâches et dossiers associés.",
  confirmer:
    "Tous les leads. Visites techniques : uniquement les fiches dont l’utilisateur est l’auteur (création de la VT).",
  closer: "Périmètre commercial élargi (tous les leads / bénéficiaires selon les règles métier).",
  sales_director: "Périmètre commercial élargi, pilotage de la direction commerciale.",
  technician: "Interventions et dossiers techniques selon les écrans prévus pour ce profil.",
  lead_generation_quantifier:
    "Validation terrain des fiches lead generation (quantification) : liste dédiée, qualification ou hors cible, sans pilotage complet du module.",
};
