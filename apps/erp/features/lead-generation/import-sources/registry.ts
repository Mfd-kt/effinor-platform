import type { LeadGenerationImportSourceCode, LeadGenerationImportSourceDefinition } from "./types";

const DEFINITIONS: readonly LeadGenerationImportSourceDefinition[] = [
  { code: "apify_google_maps", label: "Google Maps (Apify)" },
  { code: "csv_manual", label: "CSV manuel" },
] as const;

const byCode = new Map<string, LeadGenerationImportSourceDefinition>(
  DEFINITIONS.map((d) => [d.code, d]),
);

/** Définition enregistrée ou libellé technique par défaut. */
export function getLeadGenerationImportSourceDefinition(
  code: string,
): LeadGenerationImportSourceDefinition {
  return (
    byCode.get(code) ?? {
      code: code as LeadGenerationImportSourceCode,
      label: code,
    }
  );
}

export function listRegisteredLeadGenerationImportSources(): readonly LeadGenerationImportSourceDefinition[] {
  return DEFINITIONS;
}
