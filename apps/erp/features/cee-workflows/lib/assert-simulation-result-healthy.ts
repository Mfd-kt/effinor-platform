import { resolveSimulationFieldSource } from "@/features/leads/study-pdf/domain/merge-workflow-simulation-into-lead-for-pdf";

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(String(v).trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Refuse d’enregistrer une simulation « terminée » manifestement incohérente
 * (ex. déstrat avec volume nul alors que le moteur calcule toujours surface × hauteur).
 */
export function assertAgentSimulationResultHealthy(simulationResultJson: unknown): void {
  const resolved = resolveSimulationFieldSource(simulationResultJson);
  if (!resolved) {
    throw new Error("Résultat de simulation introuvable ou invalide.");
  }
  const m = resolved.metrics;
  const cee = m.ceeSolution;
  const solution =
    typeof cee === "object" && cee !== null && !Array.isArray(cee)
      ? (cee as { solution?: string }).solution
      : undefined;

  if (solution === "PAC") {
    const pac = m.pacSavings;
    if (typeof pac !== "object" || pac === null || Array.isArray(pac)) {
      throw new Error("Simulation PAC incomplète : bloc pacSavings manquant. Relancez le calculateur.");
    }
    return;
  }

  if (solution === "NONE") {
    return;
  }

  const vol = toNum(m.volumeM3);
  if (vol == null || vol <= 0) {
    throw new Error(
      "Simulation déstrat invalide : volume calculé nul. Vérifiez hauteur, surface et relancez le simulateur.",
    );
  }
}
