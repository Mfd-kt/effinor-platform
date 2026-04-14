import { stringArrayFromLeadJson } from "@/features/leads/lib/lead-media-json";
import type { LeadRow } from "@/features/leads/types";

function nonEmpty(s: string | null | undefined): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function contactIdentityOk(lead: LeadRow): boolean {
  if (nonEmpty(lead.first_name) && nonEmpty(lead.last_name)) {
    return true;
  }
  const full = lead.contact_name?.trim() ?? "";
  return full.split(/\s+/).filter(Boolean).length >= 2;
}

function fonctionOk(lead: LeadRow): boolean {
  return nonEmpty(lead.contact_role) || nonEmpty(lead.job_title);
}

function siretSiegeOk(lead: LeadRow): boolean {
  return nonEmpty(lead.head_office_siret) || nonEmpty(lead.siret);
}

/**
 * Liste des manques bloquants pour « Envoyer au closer » (données lead + médias + enregistrement).
 * Libellés courts pour affichage UI.
 */
export function getConfirmateurHandoffLeadGaps(lead: LeadRow): string[] {
  const gaps: string[] = [];

  if (stringArrayFromLeadJson(lead.aerial_photos).length === 0) {
    gaps.push("Photos aériennes (au moins un fichier)");
  }
  if (stringArrayFromLeadJson(lead.cadastral_parcel_files).length === 0) {
    gaps.push("Parcelle cadastrale (au moins un fichier)");
  }
  if (stringArrayFromLeadJson(lead.study_media_files).length === 0) {
    gaps.push("Médias de l’étude / visuels complémentaires (au moins un fichier)");
  }

  if (stringArrayFromLeadJson(lead.recording_files).length === 0) {
    gaps.push("Enregistrement d’appel (au moins un fichier audio)");
  }

  if (!nonEmpty(lead.company_name)) {
    gaps.push("Contact : société");
  }
  if (!contactIdentityOk(lead)) {
    gaps.push("Contact : prénom et nom (ou nom complet renseigné)");
  }
  if (!nonEmpty(lead.email)) {
    gaps.push("Contact : e-mail");
  }
  if (!nonEmpty(lead.phone)) {
    gaps.push("Contact : téléphone");
  }
  if (!fonctionOk(lead)) {
    gaps.push("Contact : fonction");
  }

  if (!nonEmpty(lead.head_office_address)) {
    gaps.push("Siège : adresse");
  }
  if (!siretSiegeOk(lead)) {
    gaps.push("Siège : SIRET");
  }
  if (!nonEmpty(lead.head_office_postal_code)) {
    gaps.push("Siège : code postal");
  }
  if (!nonEmpty(lead.head_office_city)) {
    gaps.push("Siège : ville");
  }

  if (!nonEmpty(lead.worksite_address)) {
    gaps.push("Site des travaux : adresse");
  }
  if (!nonEmpty(lead.worksite_siret)) {
    gaps.push("Site des travaux : SIRET");
  }
  if (!nonEmpty(lead.worksite_postal_code)) {
    gaps.push("Site des travaux : code postal");
  }
  if (!nonEmpty(lead.worksite_city)) {
    gaps.push("Site des travaux : ville");
  }

  return gaps;
}

export function isLeadCompleteForConfirmateurHandoff(lead: LeadRow): boolean {
  return getConfirmateurHandoffLeadGaps(lead).length === 0;
}
