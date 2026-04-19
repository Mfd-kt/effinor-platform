import { getLeadGenerationImportSourceDefinition } from "../import-sources/registry";

/** Libellés lisibles pour les codes source stock / import (valeurs DB inchangées en filtre). */
export function formatLeadGenerationSourceLabel(source: string): string {
  return getLeadGenerationImportSourceDefinition(source).label;
}

/** Résumé court fiche CEE + équipe pour listes d’imports. */
export function formatLeadGenerationBatchCeeHint(row: {
  cee_sheet_code?: string | null;
  target_team_name?: string | null;
}): string | null {
  const code = row.cee_sheet_code?.trim();
  const team = row.target_team_name?.trim();
  if (!code && !team) return null;
  if (code && team) return `CEE ${code} · ${team}`;
  if (code) return `CEE ${code}`;
  return team ?? null;
}
