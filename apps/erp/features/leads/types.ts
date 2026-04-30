import type { LeadB2BActiveRow, LeadB2CActiveRow } from "@/features/leads/lib/lead-extensions-access";
import type { Database } from "@/types/database.types";

/** Suivi d’appel manuel (sans sync Aircall automatique). */
export type LeadCallTraceFields = {
  last_call_status: string | null;
  last_call_at: string | null;
  last_call_note: string | null;
  last_call_recording_url: string | null;
};

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"] & LeadCallTraceFields;

/** Lead liste prospects : jointure optionnelle sur le référentiel fiches CEE. */
export type LeadListRow = LeadRow & {
  /**
   * Colonne `lead_type` (migration 2.1). Incluse via `SELECT *` dans `getLeads` ;
   * typée ici pour les composants qui affichent un sous-titre B2B conditionnel.
   */
  lead_type?: string | null;
  /** Présent si la requête joint `cee_sheets` ; sinon traiter comme `null`. */
  cee_sheet?: {
    code: string | null;
    label: string | null;
    simulator_key: string | null;
    workflow_key: string | null;
  } | null;
};

export type ProfileMini = {
  id: string;
  full_name: string | null;
  email: string;
  /** Photo de profil (Storage), si renseignée. */
  avatar_url?: string | null;
};

/** Métadonnées fiche CEE jointes sur `getLeadById` (même périmètre que résolution catégorie). */
export type LeadDetailCeeSheetPick = {
  id: string;
  code: string | null;
  label: string | null;
  simulator_key: string | null;
  workflow_key: string | null;
};

export type LeadDetailRow = LeadRow & {
  created_by_agent: ProfileMini | null;
  confirmed_by: ProfileMini | null;
  /** Renseigné par `getLeadById` ; absent si le lead est chargé ailleurs sans jointure. */
  cee_sheet?: LeadDetailCeeSheetPick | null;
};

/** Retour de `getLeadById` après Phase 2.3.C.2 : extensions actives chargées en parallèle. */
export type LeadDetailWithExtensions = LeadDetailRow & {
  b2b: LeadB2BActiveRow | null;
  b2c: LeadB2CActiveRow | null;
};

export type LeadInternalNoteWithAuthor = {
  id: string;
  body: string;
  created_at: string;
  created_by: string;
  author: ProfileMini | null;
};
