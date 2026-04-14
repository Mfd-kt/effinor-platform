import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import { resolveAgentInitialSheetId } from "@/features/cee-workflows/lib/agent-workflow-activity";
import {
  inferDestratSimulatorFromSheetMetadata,
  inferPacQuickSimulatorFromSheetMetadata,
} from "@/features/cee-workflows/lib/agent-simulator-registry";
import { normalizeProductInterestLabel } from "@/features/leads/lib/normalize-product-interest";

function normKey(simulatorKey: string | null | undefined): string {
  return (simulatorKey ?? "").trim().toLowerCase();
}

function isExplicitPacSimulatorKey(simulatorKey: string | null | undefined): boolean {
  const k = normKey(simulatorKey);
  return k === "pac" || k.startsWith("pac_") || k.startsWith("pac-");
}

function isExplicitDestratSimulatorKey(simulatorKey: string | null | undefined): boolean {
  const k = normKey(simulatorKey);
  if (isExplicitPacSimulatorKey(simulatorKey)) return false;
  return k === "destrat" || k.includes("destratification") || k.includes("destratif");
}

/**
 * Choisit la fiche CEE du poste agent à pré-sélectionner pour un lead :
 * 1) `cee_sheet_id` si le lead est déjà rattaché et la fiche est dans la liste agent ;
 * 2) sinon, catégorie commerciale (`product_interest` normalisé, souvent issu de l’IA) ;
 * 3) sinon, comportement par défaut du poste agent.
 */
export function resolvePreferredCeeSheetIdForLead(
  sheets: AgentAvailableSheet[],
  lead: { cee_sheet_id: string | null; product_interest: string | null },
): string | null {
  if (sheets.length === 0) return null;

  if (lead.cee_sheet_id && sheets.some((s) => s.id === lead.cee_sheet_id)) {
    return lead.cee_sheet_id;
  }

  const category = normalizeProductInterestLabel(lead.product_interest ?? "");

  if (category === "PAC") {
    const byKey = sheets.find((s) => isExplicitPacSimulatorKey(s.simulatorKey));
    if (byKey) return byKey.id;
    const byMeta = sheets.find((s) => inferPacQuickSimulatorFromSheetMetadata(s));
    if (byMeta) return byMeta.id;
    const byText = sheets.find((s) => {
      const blob = `${s.code} ${s.label}`.toLowerCase();
      return blob.includes("pac") || blob.includes("pompe") && blob.includes("chaleur");
    });
    if (byText) return byText.id;
  }

  if (category === "Destratificateur") {
    const byKey = sheets.find((s) => isExplicitDestratSimulatorKey(s.simulatorKey));
    if (byKey) return byKey.id;
    const byMeta = sheets.find(
      (s) => inferDestratSimulatorFromSheetMetadata(s) && !inferPacQuickSimulatorFromSheetMetadata(s),
    );
    if (byMeta) return byMeta.id;
  }

  return resolveAgentInitialSheetId(sheets, null);
}
