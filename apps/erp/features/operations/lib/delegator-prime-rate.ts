/**
 * Extrait le premier montant numérique (€/kWhc) depuis le champ libre du délégataire,
 * ex. « 0,0073 € par kWhc » ou « 0.0073 ».
 */
export function parseEuroPerKwhcFromNote(note: string | null | undefined): number | null {
  if (!note?.trim()) return null;
  const compact = note.replace(/\s/g, "");
  const m = compact.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  let raw = m[1];
  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else {
    raw = raw.replace(",", ".");
  }
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
