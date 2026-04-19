import type { LeadGenerationDispatchQueueStatus } from "../domain/statuses";
import type { LeadGenerationStockRow } from "../domain/stock-row";
import type { DispatchQueueRulesSettings } from "../settings/default-settings";

import { computeLeadGenerationDispatchQueueRank } from "./dispatch-queue-rank";

/** Seuils explicites — ajustables sans toucher au reste du module. */
const DEFAULT_RULES: DispatchQueueRulesSettings = {
  score_ready_min: 55,
  score_ready_strong: 72,
  score_low_band: 30,
  /** Plancher score pour autoriser la diffusion sans exiger email / site / confiance enrichissement (voir logique E/F). */
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
 * Décision de file de dispatch (fonction pure, étape 13).
 * Exclusions dures → téléphone → score → diffusion possible sans exiger enrichissement email/site
 * (le score commercial et le rang restent utilisés pour la priorisation).
 */
export function computeLeadGenerationDispatchQueue(
  row: LeadGenerationStockRow,
  rules: DispatchQueueRulesSettings = DEFAULT_RULES,
): LeadGenerationDispatchQueueDecision {
  const score = row.commercial_score ?? 0;
  const priority = row.commercial_priority ?? "normal";

  const phone = hasPhone(row);

  // A — Non distribuable
  if (row.duplicate_of_stock_id != null || row.qualification_status === "duplicate") {
    return finalize(row, "do_not_dispatch", "doublon");
  }
  if (row.qualification_status === "rejected" || row.stock_status === "rejected") {
    return finalize(row, "do_not_dispatch", "rejet");
  }
  if (row.stock_status === "converted") {
    return finalize(row, "do_not_dispatch", "déjà convertie");
  }
  if (row.stock_status === "expired" || row.stock_status === "archived") {
    return finalize(row, "do_not_dispatch", "stock non actif");
  }

  // B — Déjà dans un circuit commercial (pas « à distribuer maintenant » comme neuf)
  if (row.stock_status === "assigned" || row.stock_status === "in_progress") {
    return finalize(row, "review", "déjà attribuée ou en cours");
  }

  // C — Téléphone indispensable pour une mise en relation
  if (!phone) {
    return finalize(row, "low_value", "téléphone manquant");
  }

  // D — Très faible score : intérêt limité même avec téléphone
  if (score <= rules.score_low_band && priority === "low") {
    return finalize(row, "low_value", "score commercial trop faible");
  }

  // E — Prête maintenant : stock qualifié « ready », téléphone présent, score ≥ plancher (sans exiger email/site/confiance)
  if (
    row.stock_status === "ready" &&
    score >= rules.score_ready_min
  ) {
    return finalize(row, "ready_now", "fiche prête — diffusion autorisée (enrichissement complémentaire possible)");
  }

  // F — Score modéré : diffusion autorisée quand même (téléphone + plancher score), pas de blocage « enrich_first »
  if (
    row.stock_status === "ready" &&
    score >= rules.score_enrich_floor &&
    score < rules.score_ready_min
  ) {
    return finalize(row, "ready_now", "diffusion autorisée — score modéré, enrichissement complémentaire possible ensuite");
  }

  // G — Faible valeur commerciale (sans être hors-cible absolue)
  if (score <= rules.score_low_band + 5 && priority === "low") {
    return finalize(row, "low_value", "priorité commerciale basse");
  }

  // H — Cas intermédiaires (ex. statut « new » à valider, score moyen…)
  return finalize(row, "review", "à trancher manuellement");
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
