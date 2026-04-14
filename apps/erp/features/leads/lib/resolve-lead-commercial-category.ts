import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import { normalizeProductInterestLabel } from "@/features/leads/lib/normalize-product-interest";
import { extractWorkflowSimulationMetrics } from "@/features/leads/study-pdf/domain/merge-workflow-simulation-into-lead-for-pdf";

export type CeeSheetPick = {
  simulator_key: string | null;
  workflow_key: string | null;
  label: string | null;
  code: string | null;
};

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
 * Libellé « catégorie commerciale » déduit **uniquement** des métadonnées fiche CEE
 * (`simulator_key`, libellés, code) — pas de champ lead racine.
 */
export function commercialCategoryFromCeeSheet(sheet: CeeSheetPick | null | undefined): string | null {
  if (!sheet) return null;
  if (isExplicitPacSimulatorKey(sheet.simulator_key)) return "PAC";
  if (isExplicitDestratSimulatorKey(sheet.simulator_key)) return "Destratificateur";

  const blob = `${sheet.code ?? ""} ${sheet.label ?? ""}`.toLowerCase();
  if (/luminaire|\bleds?\b/.test(blob)) return "Luminaire LED";
  if (/destratif|destratification|\bdestrat\b/.test(blob)) return "Destratificateur";
  if (/pompe\s+a\s+chaleur|\bpac\b|chaudiere/.test(blob)) return "PAC";

  const fromLabel = normalizeProductInterestLabel(sheet.label ?? "");
  return fromLabel || null;
}

/**
 * Catégorie d’affichage issue de la **recommandation simulateur** (`ceeSolution.solution`),
 * pas seulement de la fiche CEE rattachée (ex. fiche déstrat sur le lead mais orientation PAC BAT-TH-163).
 */
export function simulationRecommendedCategoryLabel(
  simPayloadOrResult: unknown,
): "PAC" | "Destratificateur" | null {
  const m = extractWorkflowSimulationMetrics(simPayloadOrResult);
  if (!m) return null;
  const cee = m.ceeSolution;
  if (typeof cee !== "object" || cee === null || Array.isArray(cee)) return null;
  const sol = (cee as { solution?: string }).solution;
  if (sol === "PAC") return "PAC";
  if (sol === "DESTRAT") return "Destratificateur";
  return null;
}

/**
 * Catégorie simulateur pour un workflow fiche CEE : résultat stocké sur le workflow si exploitable,
 * sinon repli sur le payload simulation du lead (même logique que l’en-tête « Catégorie »).
 */
export function simulationCategoryForLeadWorkflow(
  workflow: { simulation_result_json: unknown },
  leadSimPayloadJson: unknown,
): "PAC" | "Destratificateur" | null {
  const fromWorkflow = simulationRecommendedCategoryLabel(workflow.simulation_result_json);
  if (fromWorkflow) return fromWorkflow;
  return simulationRecommendedCategoryLabel(leadSimPayloadJson);
}

export function formatCeeSheetCodeLabel(sheet: CeeSheetPick | null | undefined): string {
  if (!sheet) return "";
  const code = (sheet.code ?? "").trim();
  const label = (sheet.label ?? "").trim();
  if (!code && !label) return "";
  if (code && label && code !== label) return `${code} — ${label}`;
  return code || label;
}

/** Liste prospects : libellé colonne « catégorie fiche CEE » (simulation → fiche → code/libellé). */
export function leadListFicheCeeCategoryLabel(lead: {
  sim_payload_json: unknown;
  cee_sheet?: CeeSheetPick | null;
}): string {
  const fromSim = simulationRecommendedCategoryLabel(lead.sim_payload_json);
  if (fromSim) return fromSim;

  const fromSheet = commercialCategoryFromCeeSheet(lead.cee_sheet ?? null);
  if (fromSheet) return fromSheet;

  return formatCeeSheetCodeLabel(lead.cee_sheet) || "—";
}

export function leadListFicheCeeCellTitle(lead: {
  sim_payload_json: unknown;
  cee_sheet?: CeeSheetPick | null;
}): string | undefined {
  const cat = leadListFicheCeeCategoryLabel(lead);
  const sheetStr = formatCeeSheetCodeLabel(lead.cee_sheet ?? null);
  const m = extractWorkflowSimulationMetrics(lead.sim_payload_json);
  const cee = m?.ceeSolution;
  const hints: string[] = [];
  if (typeof cee === "object" && cee !== null && !Array.isArray(cee)) {
    const o = cee as Record<string, unknown>;
    if (o.solution === "DESTRAT" && typeof o.destratCeeSheetCode === "string") {
      hints.push(o.destratCeeSheetCode);
    }
    if (o.solution === "PAC") {
      hints.push("BAT-TH-163");
    }
  }
  const parts = [...new Set([cat !== "—" ? cat : "", ...hints, sheetStr].filter(Boolean))] as string[];
  return parts.length ? parts.join(" · ") : undefined;
}

export function leadListFicheCeeSearchHay(lead: {
  sim_payload_json: unknown;
  cee_sheet?: CeeSheetPick | null;
}): string {
  const m = extractWorkflowSimulationMetrics(lead.sim_payload_json);
  let extra = "";
  if (m) {
    const cee = m.ceeSolution;
    if (typeof cee === "object" && cee !== null && !Array.isArray(cee)) {
      const o = cee as Record<string, unknown>;
      const bits: string[] = [];
      if (typeof o.destratCeeSheetCode === "string") bits.push(o.destratCeeSheetCode);
      if (typeof o.commercialMessage === "string") bits.push(o.commercialMessage);
      extra = bits.join(" ");
    }
  }
  return [leadListFicheCeeCategoryLabel(lead), formatCeeSheetCodeLabel(lead.cee_sheet ?? null), extra]
    .filter(Boolean)
    .join(" ");
}

export function pickPrimaryWorkflowForLead(
  lead: { current_workflow_id: string | null },
  workflows: WorkflowScopedListRow[],
): WorkflowScopedListRow | null {
  if (workflows.length === 0) return null;
  const active = workflows.filter((w) => !w.is_archived);
  const pool = active.length > 0 ? active : workflows;
  if (lead.current_workflow_id) {
    const match = pool.find((w) => w.id === lead.current_workflow_id);
    if (match) return match;
  }
  return pool[0] ?? null;
}

/**
 * Catégorie affichée en tête de fiche : **recommandation simulateur** si présente,
 * sinon fiche CEE du workflow courant, sinon fiche rattachée au lead.
 */
export function resolveLeadCommercialCategoryForUi(
  lead: { current_workflow_id: string | null; sim_payload_json?: unknown },
  workflows: WorkflowScopedListRow[],
  leadRootCeeSheet?: CeeSheetPick | null,
): string {
  const fromLeadPayload = simulationRecommendedCategoryLabel(lead.sim_payload_json);
  if (fromLeadPayload) return fromLeadPayload;

  const wf = pickPrimaryWorkflowForLead(lead, workflows);
  const fromWfSim = wf?.simulation_result_json
    ? simulationRecommendedCategoryLabel(wf.simulation_result_json)
    : null;
  if (fromWfSim) return fromWfSim;

  const fromWorkflowSheet = wf?.cee_sheet ? commercialCategoryFromCeeSheet(wf.cee_sheet) : null;
  if (fromWorkflowSheet) return fromWorkflowSheet;

  const fromLeadRoot = leadRootCeeSheet ? commercialCategoryFromCeeSheet(leadRootCeeSheet) : null;
  if (fromLeadRoot) return fromLeadRoot;

  return "";
}
