import type { LeadGenerationSourceChannel } from "../domain/raw-input";

/** Signal « base » — Google Maps. */
export const SOURCE_SIGNAL_GOOGLE_MAPS = 25;
/** Bonus qualité — Pages Jaunes (annuaire). */
export const SOURCE_SIGNAL_YELLOW_PAGES_BONUS = 30;
/** Premium — LinkedIn (coûteux : réservé au blending ou enrichissement ciblé). */
export const SOURCE_SIGNAL_LINKEDIN_PREMIUM = 35;

/** Score combiné 0–100 selon les canaux présents sur la fiche fusionnée. */
export function combinedSourceSignalScore(channels: LeadGenerationSourceChannel[]): number {
  const set = new Set(channels);
  let s = 0;
  if (set.has("google_maps")) s += SOURCE_SIGNAL_GOOGLE_MAPS;
  if (set.has("yellow_pages")) s += SOURCE_SIGNAL_YELLOW_PAGES_BONUS;
  if (set.has("linkedin")) s += SOURCE_SIGNAL_LINKEDIN_PREMIUM;
  return Math.min(100, s);
}

/** Seuil minimal pour lancer un enrichissement LinkedIn (économie API). */
export const LINKEDIN_ENRICH_MIN_SOURCE_SIGNAL = 45;
/** Seuil commercial alternatif (si scoring déjà calculé). */
export const LINKEDIN_ENRICH_MIN_COMMERCIAL_SCORE = 58;
/** Plafond dur par run LinkedIn (actor) — parcours unifié max 40. */
export const LINKEDIN_ENRICH_BATCH_HARD_CAP = 40;
