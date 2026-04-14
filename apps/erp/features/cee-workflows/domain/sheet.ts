export function assertCommercialSheetIsActive(sheet: {
  is_commercial_active: boolean;
  label?: string | null;
}): void {
  if (!sheet.is_commercial_active) {
    throw new Error(
      sheet.label
        ? `La fiche CEE "${sheet.label}" est inactive.`
        : "La fiche CEE sélectionnée est inactive.",
    );
  }
}
