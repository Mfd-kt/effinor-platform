/** Libellé court « type bâtiment » depuis les réponses dynamiques (ex. BAT-TH-142), sans dépendre du template. */
export function buildingTypePreviewFromFormAnswers(formAnswers: unknown): string | null {
  if (!formAnswers || typeof formAnswers !== "object" || Array.isArray(formAnswers)) {
    return null;
  }
  const v = (formAnswers as Record<string, unknown>).building_type;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
