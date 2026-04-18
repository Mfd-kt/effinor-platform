import type { RunGoogleMapsApifyImportInput, RunGoogleMapsApifyImportResult } from "./types";

/**
 * @deprecated Étape 7 — import Apify **synchrone**. Remplacé par
 * `startGoogleMapsApifyImport` + `syncGoogleMapsApifyImport` (étape 8).
 * Ne plus appeler depuis l’UI ni les actions.
 */
export async function runGoogleMapsApifyImport(
  _input: RunGoogleMapsApifyImportInput,
): Promise<RunGoogleMapsApifyImportResult> {
  throw new Error(
    "Import Apify synchrone déprécié : utilisez startGoogleMapsApifyImport puis syncGoogleMapsApifyImport.",
  );
}
