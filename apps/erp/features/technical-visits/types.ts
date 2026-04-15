import type { Database } from "@/types/database.types";

import type { VisitStartGeoCoherence } from "@/features/technical-visits/geo/start-geo-constants";

export type TechnicalVisitRow = Database["public"]["Tables"]["technical_visits"]["Row"];

/** Dernière preuve GPS au démarrage (lecture fiche). */
export type TechnicalVisitStartGeoProofSummary = {
  id: string;
  coherence: VisitStartGeoCoherence;
  server_recorded_at: string;
  client_captured_at: string | null;
  distance_to_site_m: number | null;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  provider_error_code: string | null;
  worksite_latitude_snapshot: number | null;
  worksite_longitude_snapshot: number | null;
};

export type LeadMini = {
  id: string;
  company_name: string;
};

export type TechnicianMini = {
  id: string;
  full_name: string | null;
  email: string;
};

export type TechnicalVisitFieldAccessLevel = "full" | "technician_restricted";

export type TechnicalVisitListRow = TechnicalVisitRow & {
  lead_company_name: string | null;
  technician_label: string | null;
  /** Niveau d’accès champs sensibles pour le visiteur courant (liste / cartes terrain). */
  technician_field_access?: TechnicalVisitFieldAccessLevel;
};

export type TechnicalVisitDetailRow = TechnicalVisitRow & {
  leads: LeadMini | null;
  technician: TechnicianMini | null;
  start_geo_proof?: TechnicalVisitStartGeoProofSummary | null;
};

export type LeadOption = {
  id: string;
  company_name: string;
};

export type ProfileOption = {
  id: string;
  label: string;
};

export type TechnicalVisitFormOptions = {
  leads: LeadOption[];
  /** Comptes avec le rôle applicatif « Technicien » uniquement. */
  profiles: ProfileOption[];
  /**
   * Affectation enregistrée qui n'a pas le rôle technicien (affichage seul, option désactivée).
   * Permet de voir l'ancienne valeur sans la mélanger aux vrais techniciens.
   */
  technicianOrphanOption?: ProfileOption | null;
};
