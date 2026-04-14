/**
 * Texte « Informations manquantes » issu de `qualification_data_json` (confirmateur), pour affichage closer.
 */
export function missingInformationForCloserDisplay(qualificationDataJson: unknown): string | null {
  if (!qualificationDataJson || typeof qualificationDataJson !== "object" || Array.isArray(qualificationDataJson)) {
    return null;
  }
  const raw = (qualificationDataJson as Record<string, unknown>).missing_information;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t ? t : null;
}
