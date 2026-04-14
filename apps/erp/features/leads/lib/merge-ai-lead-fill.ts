import type { UseFormSetValue } from "react-hook-form";

import type { LeadFormInput, LeadInsertInput } from "@/features/leads/schemas/lead.schema";

type SetOpts = { shouldDirty: boolean; shouldTouch: boolean };

const setOpts: SetOpts = { shouldDirty: true, shouldTouch: true };

function isEmptyString(v: unknown): boolean {
  return typeof v !== "string" || v.trim() === "";
}

/** Champ nombre du formulaire encore vide (y compris NaN / chaîne vide). */
function isUnsetNumber(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "number") return Number.isNaN(v);
  if (typeof v === "string") return v.trim() === "";
  return true;
}

/**
 * Applique le résultat de l’analyse IA : écrase toujours notes + résumé + score,
 * complète les autres champs seulement s’ils sont encore vides.
 */
export function mergeAiLeadFillIntoForm(
  fill: Partial<LeadInsertInput>,
  current: LeadFormInput,
  setValue: UseFormSetValue<LeadFormInput>,
  recordingNotesMarkdown: string,
) {
  setValue("recording_notes", recordingNotesMarkdown, setOpts);

  if (fill.ai_lead_summary != null && String(fill.ai_lead_summary).trim() !== "") {
    setValue("ai_lead_summary", String(fill.ai_lead_summary).trim(), setOpts);
  }
  if (fill.ai_lead_score !== undefined && fill.ai_lead_score !== null) {
    setValue("ai_lead_score", fill.ai_lead_score, setOpts);
  }

  if (!isEmptyString(fill.product_interest) && isEmptyString(current.product_interest)) {
    setValue("product_interest", fill.product_interest!.trim(), setOpts);
  }

  if (!isEmptyString(fill.company_name) && isEmptyString(current.company_name)) {
    setValue("company_name", fill.company_name!.trim(), setOpts);
  }
  if (!isEmptyString(fill.first_name) && isEmptyString(current.first_name)) {
    setValue("first_name", fill.first_name!.trim(), setOpts);
  }
  if (!isEmptyString(fill.last_name) && isEmptyString(current.last_name)) {
    setValue("last_name", fill.last_name!.trim(), setOpts);
  }
  if (!isEmptyString(fill.phone) && isEmptyString(current.phone)) {
    setValue("phone", fill.phone!.trim(), setOpts);
  }
  if (!isEmptyString(fill.email) && isEmptyString(current.email)) {
    setValue("email", fill.email!.trim(), setOpts);
  }
  if (!isEmptyString(fill.contact_role) && isEmptyString(current.contact_role)) {
    setValue("contact_role", fill.contact_role!.trim(), setOpts);
  }
  if (!isEmptyString(fill.siret) && isEmptyString(current.siret)) {
    setValue("siret", fill.siret!.trim(), setOpts);
  }
  if (!isEmptyString(fill.head_office_address) && isEmptyString(current.head_office_address)) {
    setValue("head_office_address", fill.head_office_address!.trim(), setOpts);
  }
  if (!isEmptyString(fill.head_office_postal_code) && isEmptyString(current.head_office_postal_code)) {
    setValue("head_office_postal_code", fill.head_office_postal_code!.trim(), setOpts);
  }
  if (!isEmptyString(fill.head_office_city) && isEmptyString(current.head_office_city)) {
    setValue("head_office_city", fill.head_office_city!.trim(), setOpts);
  }
  if (!isEmptyString(fill.worksite_address) && isEmptyString(current.worksite_address)) {
    setValue("worksite_address", fill.worksite_address!.trim(), setOpts);
  }
  if (!isEmptyString(fill.worksite_postal_code) && isEmptyString(current.worksite_postal_code)) {
    setValue("worksite_postal_code", fill.worksite_postal_code!.trim(), setOpts);
  }
  if (!isEmptyString(fill.worksite_city) && isEmptyString(current.worksite_city)) {
    setValue("worksite_city", fill.worksite_city!.trim(), setOpts);
  }
  if (fill.building_type && isEmptyString(current.building_type)) {
    setValue("building_type", fill.building_type, setOpts);
  }

  if (fill.surface_m2 !== undefined && isUnsetNumber(current.surface_m2)) {
    setValue("surface_m2", fill.surface_m2, setOpts);
  }
  if (fill.ceiling_height_m !== undefined && isUnsetNumber(current.ceiling_height_m)) {
    setValue("ceiling_height_m", fill.ceiling_height_m, setOpts);
  }
  if (fill.warehouse_count !== undefined && isUnsetNumber(current.warehouse_count)) {
    setValue("warehouse_count", fill.warehouse_count, setOpts);
  }

  const heatedEmpty =
    current.heated_building === "" ||
    current.heated_building === null ||
    current.heated_building === undefined;
  if (fill.heated_building !== undefined && fill.heated_building !== null && heatedEmpty) {
    setValue("heated_building", fill.heated_building ? "true" : "false", setOpts);
  }

  const noHeating = !current.heating_type?.length;
  if (fill.heating_type?.length && noHeating) {
    setValue("heating_type", fill.heating_type, setOpts);
  }
}
