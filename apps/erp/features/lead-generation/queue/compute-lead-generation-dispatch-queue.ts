import type { LeadGenerationDispatchQueueStatus } from "../domain/statuses";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import type { DispatchQueueRulesSettings } from "../settings/default-settings";

import { computeLeadGenerationDispatchQueueRank } from "./dispatch-queue-rank";

/** Seuils hérités (priorisation / textes) — la diffusion ne bloque plus sur la qualification quantif. */
const DEFAULT_RULES: DispatchQueueRulesSettings = {
  score_ready_min: 55,
  score_ready_strong: 72,
  score_low_band: 30,
  score_enrich_floor: 0,
};

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export type LeadGenerationDispatchQueueDecision = {
  dispatchQueueStatus: LeadGenerationDispatchQueueStatus;
  dispatchQueueReason: string;
  dispatchQueueRank: number;
};

function hasPhone(row: LeadGenerationStockRow): boolean {
  return hasText(row.phone) || hasText(row.normalized_phone);
}

/**
 * Décision de file de dispatch (fiche pure, étape 13).
 *
 * Règle produit : toute fiche **importable** (hors doublon / rejet / terminée) avec **téléphone**
 * part en **prêt maintenant** — imports CSV, Apify, etc. ne restent plus bloqués en « non diffusé »
 * faute de passage par la quantif.
 *
 * Cas exclus : fiches déjà prises en charge côté terrain (attribué / en cours) → `review` ;
 * sans moyen de contact téléphonique → `low_value`.
 */
export function computeLeadGenerationDispatchQueue(
  row: LeadGenerationStockRow,
  _rules: DispatchQueueRulesSettings = DEFAULT_RULES,
): LeadGenerationDispatchQueueDecision {
  const phone = hasPhone(row);

  // A — Non distribuable (exclusions dures)
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
    return finalize(row, "do_not_dispatch", "doublon");
  }
  if (row.qualification_status === "rejected" || row.stock_status === "rejected") {
    return finalize(row, "do_not_dispatch", "rejet");
  }
  if (row.stock_status === "converted" || row.converted_lead_id) {
    return finalize(row, "do_not_dispatch", "déjà convertie");
  }
  if (row.stock_status === "expired" || row.stock_status === "archived") {
    return finalize(row, "do_not_dispatch", "stock non actif");
  }

  // B — Déjà dans le circuit opérationnel (file agent / ouvert) : pas le même sens que « à sonner maintenant »
  if (row.stock_status === "assigned" || row.stock_status === "in_progress") {
    return finalize(row, "review", "déjà attribuée ou en cours côté commercial");
  }

  // C — Pas de ligne téléphonique exploitable
  if (!phone) {
    return finalize(row, "low_value", "téléphone manquant — ne peut pas figurer en prêt à contacter");
  }

  // D — Défaut : prêt maintenant (nouveau, to_validate, CSV, Apify, etc.)
  return finalize(
    row,
    "ready_now",
    "Prêt à contacter — fiche importée ou disponible pour appel / dispatch (règle par défaut).",
  );
}

function finalize(
  row: LeadGenerationStockRow,
  dispatchQueueStatus: LeadGenerationDispatchQueueStatus,
  dispatchQueueReason: string,
): LeadGenerationDispatchQueueDecision {
  const commercialScore = row.commercial_score ?? 0;
  return {
    dispatchQueueStatus,
    dispatchQueueReason,
    dispatchQueueRank: computeLeadGenerationDispatchQueueRank(dispatchQueueStatus, commercialScore),
  };
}
