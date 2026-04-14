import type { AgentAvailableSheet } from "@/features/cee-workflows/lib/agent-workflow-activity";
import { resolveAgentInitialSheetId } from "@/features/cee-workflows/lib/agent-workflow-activity";

/**
 * Choisit la fiche CEE du poste agent à pré-sélectionner pour un lead :
 * 1) `cee_sheet_id` si le lead est déjà rattaché et la fiche est dans la liste agent ;
 * 2) sinon, comportement par défaut du poste agent (ex. fiche déstrat si disponible).
 */
export function resolvePreferredCeeSheetIdForLead(
  sheets: AgentAvailableSheet[],
  lead: { cee_sheet_id: string | null },
): string | null {
  if (sheets.length === 0) return null;

  if (lead.cee_sheet_id && sheets.some((s) => s.id === lead.cee_sheet_id)) {
    return lead.cee_sheet_id;
  }

  return resolveAgentInitialSheetId(sheets, null);
}
