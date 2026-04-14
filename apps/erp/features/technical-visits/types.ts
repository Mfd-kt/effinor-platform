import type { Database } from "@/types/database.types";

export type TechnicalVisitRow = Database["public"]["Tables"]["technical_visits"]["Row"];

export type LeadMini = {
  id: string;
  company_name: string;
};

export type TechnicianMini = {
  id: string;
  full_name: string | null;
  email: string;
};

export type TechnicalVisitListRow = TechnicalVisitRow & {
  lead_company_name: string | null;
  technician_label: string | null;
};

export type TechnicalVisitDetailRow = TechnicalVisitRow & {
  leads: LeadMini | null;
  technician: TechnicianMini | null;
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
