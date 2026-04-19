import type { RunGoogleMapsApifyImportInput } from "../apify/types";

export type LeadGenerationBatchCeeColumns = {
  cee_sheet_id: string;
  cee_sheet_code: string;
  target_team_id: string;
};

/** Colonnes SQL à fusionner dans un insert `lead_generation_import_batches` (flux avec contexte CEE résolu). */
export function leadGenerationBatchCeeInsertColumns(
  cee: LeadGenerationBatchCeeColumns | null | undefined,
): Partial<LeadGenerationBatchCeeColumns> {
  if (!cee) {
    return {};
  }
  return {
    cee_sheet_id: cee.cee_sheet_id,
    cee_sheet_code: cee.cee_sheet_code,
    target_team_id: cee.target_team_id,
  };
}

/** Propage le rattachement CEE depuis l’input Apify / parcours (après résolution côté serveur). */
export function readCeeContextFromApifyInput(
  input: RunGoogleMapsApifyImportInput,
): LeadGenerationBatchCeeColumns | null {
  const sheet = input.ceeSheetId?.trim();
  const team = input.targetTeamId?.trim();
  const code = input.ceeSheetCode?.trim();
  if (!sheet || !team || !code) {
    return null;
  }
  return {
    cee_sheet_id: sheet,
    target_team_id: team,
    cee_sheet_code: code.slice(0, 80),
  };
}
