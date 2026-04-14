/** Valeurs persistées en base (chaîne vide = non renseigné côté UI). */
export const LEAD_CIVILITY_VALUES = ["", "M.", "Mme"] as const;

/** Options affichées formulaire lead / poste agent (M. / Mme). */
export const LEAD_CIVILITY_OPTIONS: { value: (typeof LEAD_CIVILITY_VALUES)[number]; label: string }[] = [
  { value: "", label: "—" },
  { value: "M.", label: "M." },
  { value: "Mme", label: "Mme" },
];

/** Normalise une civilité issue de texte libre (prompt IA, imports). */
export function normalizeLeadCivilityFromText(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();
  if (t === "M." || t === "M" || /^m\.?$/i.test(t) || /^monsieur$/i.test(t)) return "M.";
  if (t === "Mme" || /^mme\.?$/i.test(t) || /^madame$/i.test(t)) return "Mme";
  return undefined;
}
