export type LeadGenerationMyQueueCeeSheetOption = {
  id: string;
  code: string;
  label: string;
};

/**
 * Valeur du select « Je travaille sur la fiche CEE » pour les prospections sans fiche rattachée (lot sans lien CEE).
 * Stockée en localStorage comme les UUID de fiches.
 */
export const MY_QUEUE_NO_CEE_SHEET_SENTINEL = "__lg_my_queue_no_cee_sheet__";

export const MY_QUEUE_NO_CEE_SHEET_LABEL = "Sans périmètre";

/** Libellé lisible (nom métier en premier, code entre parenthèses si utile). */
export function formatMyQueueCeeSheetOptionLabel(o: LeadGenerationMyQueueCeeSheetOption): string {
  const label = o.label?.trim() ?? "";
  const code = o.code?.trim() ?? "";
  if (label && code && label !== code) {
    return `${label} (${code})`;
  }
  if (label) {
    return label;
  }
  if (code) {
    return code;
  }
  return "Périmètre";
}
