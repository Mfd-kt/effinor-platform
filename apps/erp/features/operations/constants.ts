import type {
  AdminStatus,
  OperationStatus,
  SalesStatus,
  TechnicalStatus,
} from "@/types/database.types";

export const OPERATION_STATUS_LABELS: Record<OperationStatus, string> = {
  draft: "Brouillon",
  technical_qualification: "Qualification technique",
  quote_preparation: "Devis en préparation",
  quote_sent: "Devis envoyé",
  quote_signed: "Devis signé",
  installation_planned: "Installation planifiée",
  installation_in_progress: "Installation en cours",
  installation_completed: "Installation réalisée",
  delivered_without_install: "Livrer SS instal",
  cee_compliance_review: "Contrôle & Conformité (CEE)",
  dossier_complete: "Dossier complet",
  anomaly_to_resubmit: "Anomalie à résigner",
  polluter_filed: "Déposé pollueur",
  cofrac_control: "Contrôle Cofrac",
  invoicing_call: "Appel à facturation",
  payment_pending: "En attente de paiement",
  prime_paid: "Prime versée",
  cancelled_off_target: "Annulé / Hors cible",
  not_eligible: "Non éligible",
  cancelled_by_client: "Annulé client",
  delivery_requested: "Demande de livraison",
  in_progress: "En cours (ancien)",
  on_hold: "En pause (ancien)",
  completed: "Terminé (ancien)",
  cancelled: "Annulé (ancien)",
  archived: "Archivé (ancien)",
};

export const SALES_STATUS_LABELS: Record<SalesStatus, string> = {
  draft: "Brouillon",
  to_contact: "À contacter",
  qualified: "Qualifié",
  proposal: "Proposition",
  quote_sent: "Devis envoyé",
  quote_signed: "Devis signé",
  won: "Gagné",
  lost: "Perdu",
  stalled: "Bloqué (commercial)",
};

export const ADMIN_STATUS_LABELS: Record<AdminStatus, string> = {
  pending: "En attente",
  in_review: "En revue",
  complete: "Complet",
  blocked: "Bloqué",
  archived: "Archivé",
};

export const TECHNICAL_STATUS_LABELS: Record<TechnicalStatus, string> = {
  pending: "En attente",
  study_in_progress: "Étude en cours",
  validated: "Validé",
  blocked: "Bloqué",
};
