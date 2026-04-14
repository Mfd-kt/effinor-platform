import { readStudyCeeSolutionKindFromSimulation } from "./merge-workflow-simulation-into-lead-for-pdf";
import {
  normalizeAgreementTemplateKey,
  normalizePresentationTemplateKey,
} from "./study-template-keys";
import type { LeadDetailRow } from "@/features/leads/types";

import type { StudyCeeSheetForPdf, StudyCeeSolutionKind } from "./types";

function kindFromExplicitTemplateKeys(
  presentationKey: string | null,
  agreementKey: string | null,
): StudyCeeSolutionKind | null {
  const p = presentationKey?.trim().toLowerCase();
  const a = agreementKey?.trim().toLowerCase();
  if (p === "pac_v1" || a === "pac_v1") return "pac";
  if (p === "destrat_v1" || a === "destrat_v1") return "destrat";
  return null;
}

function kindFromSimulatorKey(simulatorKey: string | null): StudyCeeSolutionKind | null {
  const s = (simulatorKey ?? "").toLowerCase().trim();
  if (!s) return null;
  if (s.includes("pac")) return "pac";
  if (s.includes("destrat")) return "destrat";
  return null;
}

/**
 * Priorité gabarit : clés explicites sur la fiche → `simulator_key` → simulation → défaut déstrat.
 */
export function resolveStudyTemplatesFromCeeSheet(
  sheet: StudyCeeSheetForPdf | null,
  lead: LeadDetailRow,
  mergedSimulationJson?: unknown,
): {
  ceeSolutionKind: StudyCeeSolutionKind;
  presentationTemplateKey: string;
  agreementTemplateKey: string;
  simulationVersusSheetMismatch: boolean;
} {
  const fromSim = readStudyCeeSolutionKindFromSimulation({ lead, mergedSimulationJson });

  let kind: StudyCeeSolutionKind;

  if (sheet) {
    const fromKeys = kindFromExplicitTemplateKeys(
      sheet.presentationTemplateKey,
      sheet.agreementTemplateKey,
    );
    if (fromKeys != null) {
      kind = fromKeys;
    } else {
      const fromSk = kindFromSimulatorKey(sheet.simulatorKey);
      if (fromSk != null) {
        kind = fromSk;
      } else {
        kind = fromSim;
      }
    }
  } else {
    kind = fromSim;
  }

  const kindForTemplates: StudyCeeSolutionKind = kind === "none" ? "destrat" : kind;

  const presentationTemplateKey = normalizePresentationTemplateKey(
    sheet?.presentationTemplateKey ?? null,
    kindForTemplates,
  );
  const agreementTemplateKey = normalizeAgreementTemplateKey(
    sheet?.agreementTemplateKey ?? null,
    kindForTemplates,
  );

  const simulationVersusSheetMismatch = sheet != null && fromSim !== "none" && kind !== fromSim;

  return {
    ceeSolutionKind: kind,
    presentationTemplateKey,
    agreementTemplateKey,
    simulationVersusSheetMismatch,
  };
}
