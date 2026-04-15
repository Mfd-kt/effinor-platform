import type {
  TechnicalVisitDetailRow,
  TechnicalVisitListRow,
  TechnicalVisitStartGeoProofSummary,
} from "@/features/technical-visits/types";
import type { Json } from "@/types/database.types";

const EMPTY_PHOTOS: Json = { visit_photos: [], report_pdfs: [], sketches: [] } as Json;
const EMPTY_FORM: Json = {} as Json;

function sanitizeStartGeoProofSummary(
  proof: TechnicalVisitStartGeoProofSummary | null | undefined,
): TechnicalVisitStartGeoProofSummary | null {
  if (!proof) return null;
  return {
    ...proof,
    latitude: null,
    longitude: null,
    accuracy_m: null,
    worksite_latitude_snapshot: null,
    worksite_longitude_snapshot: null,
  };
}

/**
 * Copie « sûre » pour liste / cartes : pas d’adresse complète, pas de société lead, pas de coords précises,
 * pas de textes sensibles ni gabarit dynamique côté client.
 */
export function sanitizeTechnicalVisitListRowForRestrictedTechnician(
  row: TechnicalVisitListRow,
): TechnicalVisitListRow {
  return {
    ...row,
    lead_company_name: null,
    /** Masqué côté payload rendu ; le type DB impose `string`, d’où le cast final. */
    lead_id: "" as unknown as TechnicalVisitListRow["lead_id"],
    worksite_address: null,
    worksite_latitude: null,
    worksite_longitude: null,
    heating_type: null,
    observations: null,
    technical_report: null,
    photos: EMPTY_PHOTOS,
    form_answers_json: EMPTY_FORM,
    visit_template_key: null,
    visit_template_version: null,
    visit_schema_snapshot_json: null,
    beneficiary_id: null,
    workflow_id: null,
  };
}

/**
 * Fiche détail : même principe ; lead et lien workflow masqués côté payload rendu au technicien restreint.
 */
export function sanitizeTechnicalVisitDetailForRestrictedTechnician(
  row: TechnicalVisitDetailRow,
): TechnicalVisitDetailRow {
  return {
    ...row,
    leads: null,
    lead_id: "" as unknown as TechnicalVisitDetailRow["lead_id"],
    worksite_address: null,
    worksite_latitude: null,
    worksite_longitude: null,
    heating_type: null,
    observations: null,
    technical_report: null,
    photos: EMPTY_PHOTOS,
    form_answers_json: EMPTY_FORM,
    visit_template_key: null,
    visit_template_version: null,
    visit_schema_snapshot_json: null,
    beneficiary_id: null,
    workflow_id: null,
    start_geo_proof: sanitizeStartGeoProofSummary(row.start_geo_proof),
  };
}
