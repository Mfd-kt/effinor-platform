import type { LeadSource } from "@/types/database.types";

/** Libellés FR pour la colonne source (liste / formulaires). */
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Site web",
  cold_call: "Appel froid",
  commercial_callback: "Rappel commercial",
  landing_froid: "Landing froid",
  landing_lum: "Landing luminaires",
  landing_destrat: "Landing déstratification",
  lead_generation: "Lead generation",
  hpf: "HPF",
  kompas: "Kompas",
  site_internet: "Site internet",
  prospecting_kompas: "Prospection Kompas",
  phone: "Téléphone",
  partner: "Partenaire",
  referral: "Recommandation",
  other: "Autre",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  dossier_sent: "Dossier envoyé",
  accord_received: "Accord reçu",
  nurturing: "En suivi",
  lost: "Perdu",
  converted: "Converti",
};
