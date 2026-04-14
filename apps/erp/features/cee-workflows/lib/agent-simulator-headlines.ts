import type { SimulatorComputedResult } from "@/features/leads/simulator/domain/types";

export type AgentSimulatorHeadlines = {
  /** Titre complet de la fenêtre (ex. « Simulateur — … »). */
  dialogTitle: string;
  contextTitle: string;
  contextBadge: string;
  contextDescription: string;
};

/**
 * Libellés simulateur agent : quand le moteur retient une PAC (ex. BAT-TH-163),
 * l’UI ne doit plus afficher uniquement le libellé de la fiche « déstrat » ouverte.
 */
export function resolveAgentSimulatorHeadlines(
  sheetLabel: string,
  sheetCode: string,
  previewResult: SimulatorComputedResult | null,
): AgentSimulatorHeadlines {
  const sol = previewResult?.ceeSolution?.solution;

  if (sol === "PAC") {
    return {
      dialogTitle: "Simulateur — Pompe à chaleur air/eau (BAT-TH-163)",
      contextTitle: "Pompe à chaleur air/eau",
      contextBadge: "BAT-TH-163",
      contextDescription: `Recommandation moteur : PAC pour les paramètres saisis. Fiche dossier ouverte : « ${sheetLabel} » (${sheetCode}).`,
    };
  }

  if (sol === "DESTRAT") {
    const destratCode = previewResult?.ceeSolution?.destratCeeSheetCode ?? sheetCode;
    return {
      dialogTitle: `Simulateur — ${sheetLabel}`,
      contextTitle: sheetLabel,
      contextBadge: destratCode,
      contextDescription: "Fiche active pour ce simulateur.",
    };
  }

  if (sol === "NONE") {
    return {
      dialogTitle: `Simulateur — ${sheetLabel}`,
      contextTitle: sheetLabel,
      contextBadge: sheetCode,
      contextDescription:
        "Recommandation : hors périmètre CEE avec les hypothèses saisies. La fiche sert de support de conversation.",
    };
  }

  return {
    dialogTitle: `Simulateur — ${sheetLabel}`,
    contextTitle: sheetLabel,
    contextBadge: sheetCode,
    contextDescription: "Fiche active pour ce simulateur.",
  };
}
