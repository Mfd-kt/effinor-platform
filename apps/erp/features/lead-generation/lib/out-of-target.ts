import type { LeadGenerationStockRow } from "../domain/stock-row";

/** Codes stables « hors cible » (préfixe `oot:`). */
export const LEAD_GEN_OUT_OF_TARGET_REASON_CODES = [
  "oot:batiment_non_eligible",
  "oot:activite_non_cible",
  "oot:residentiel",
  "oot:pas_de_hauteur",
  "oot:pas_de_chauffage_visible",
  "oot:doublon_hors_cible",
  "oot:retour_terrain_non_cible",
  "oot:non_precise",
] as const;

export type LeadGenOutOfTargetReasonCode = (typeof LEAD_GEN_OUT_OF_TARGET_REASON_CODES)[number];

export function isLeadGenOutOfTargetReasonCode(code: string): code is LeadGenOutOfTargetReasonCode {
  return (LEAD_GEN_OUT_OF_TARGET_REASON_CODES as readonly string[]).includes(code);
}

/** Normalise un code saisi (UI) vers un code `oot:` connu. */
export function normalizeLeadGenOutOfTargetReasonCode(
  code: string | null | undefined,
): LeadGenOutOfTargetReasonCode {
  const c = code?.trim() ?? "";
  if (isLeadGenOutOfTargetReasonCode(c)) {
    return c;
  }
  return "oot:non_precise";
}

/** Fiche exclue durablement du pipe commercial / quantif (hors cible définitif ou auto-exclusion doublon). */
export function isLeadGenerationStockDurableOutOfTarget(row: LeadGenerationStockRow): boolean {
  if (row.qualification_status !== "rejected" || row.stock_status !== "rejected") {
    return false;
  }
  const r = row.rejection_reason?.trim() ?? "";
  if (!r) {
    return false;
  }
  return (
    r.startsWith("quantifier_validation:") ||
    r.startsWith("hub_validation:") ||
    r.startsWith("oot:") ||
    r.startsWith("auto_oot:") ||
    r.startsWith("agent_terminal_call:out_of_target")
  );
}

export const AUTO_OOT_DUPLICATE_REJECTION = "auto_oot:duplicate_of_out_of_target" as const;
