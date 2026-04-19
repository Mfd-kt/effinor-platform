import type { LeadGenerationSourceChannel } from "../domain/raw-input";

/** Signal « base » — Google Maps. */
export const SOURCE_SIGNAL_GOOGLE_MAPS = 25;
/** Premium — LinkedIn (enrichissement ciblé, hors scraping principal). */
export const SOURCE_SIGNAL_LINKEDIN_PREMIUM = 35;

/** Score combiné 0–100 selon les canaux présents (scraping principal = Maps uniquement). */
export function combinedSourceSignalScore(channels: LeadGenerationSourceChannel[]): number {
  const set = new Set(channels);
  let s = 0;
  if (set.has("google_maps")) s += SOURCE_SIGNAL_GOOGLE_MAPS;
  if (set.has("linkedin")) s += SOURCE_SIGNAL_LINKEDIN_PREMIUM;
  return Math.min(100, s);
}
