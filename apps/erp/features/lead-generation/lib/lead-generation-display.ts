import { getLeadGenerationImportSourceDefinition } from "../import-sources/registry";

/** Libellés lisibles pour les codes source stock / import (valeurs DB inchangées en filtre). */
export function formatLeadGenerationSourceLabel(source: string): string {
  return getLeadGenerationImportSourceDefinition(source).label;
}
