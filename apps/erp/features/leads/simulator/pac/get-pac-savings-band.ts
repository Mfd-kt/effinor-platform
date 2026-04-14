import type { PacSavingsBand } from "@/features/leads/simulator/pac/types";

/**
 * Qualifie le niveau d’économie relative (pour affichage / priorisation commerciale).
 */
export function getPacSavingsBand(percent: number): PacSavingsBand {
  if (!Number.isFinite(percent)) return "faible";
  if (percent < 35) return "faible";
  if (percent < 50) return "moyen";
  if (percent < 70) return "fort";
  return "tres_fort";
}
