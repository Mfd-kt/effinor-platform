import { normalizeProductInterestLabel } from "@/features/leads/lib/normalize-product-interest";
import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";

type CeeSheetPick = {
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
 * Libellé « catégorie commerciale » aligné sur `product_interest` / analyse IA,
 * déduit de la fiche CEE rattachée au workflow.
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
 * Catégorie affichée en tête de fiche et dans le formulaire.
 *
 * Priorité au **lead** (`product_interest`, souvent IA ou saisie) : c’est la vérité commerciale (ex. PAC).
 * Si vide ou non renseigné, on retombe sur la fiche CEE du workflow (carte « Workflow fiche CEE »).
 * Ainsi un workflow encore rattaché à la mauvaise fiche ne force pas « déstrat » si le lead est déjà en PAC.
 */
export function resolveLeadCommercialCategoryForUi(
  lead: { product_interest: string | null; current_workflow_id: string | null },
  workflows: WorkflowScopedListRow[],
): string {
  const normalizedLead = normalizeProductInterestLabel(lead.product_interest ?? "");
  if (normalizedLead) return normalizedLead;

  const rawTrim = (lead.product_interest ?? "").trim();
  if (rawTrim) return rawTrim;

  const wf = pickPrimaryWorkflowForLead(lead, workflows);
  const fromSheet = wf?.cee_sheet ? commercialCategoryFromCeeSheet(wf.cee_sheet) : null;
  if (fromSheet) return fromSheet;

  return "";
}
