/** Valeurs stockées en base (liste unique « type de bâtiment »). */
export const BUILDING_TYPE_VALUES = [
  "INDUSTRIE",
  "TERTIAIRE",
  "COMMERCES",
  "SPORT",
  "SANTÉ",
  "HÔTELLERIE",
  "ENSEIGNEMENT",
  "AUTRES",
] as const;

export type BuildingType = (typeof BUILDING_TYPE_VALUES)[number];

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  INDUSTRIE: "Industrie",
  TERTIAIRE: "Tertiaire",
  COMMERCES: "Commerces",
  SPORT: "Sport",
  SANTÉ: "Santé",
  HÔTELLERIE: "Hôtellerie",
  ENSEIGNEMENT: "Enseignement",
  AUTRES: "Autres",
};

function foldAscii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Reconnaît une valeur d’enum déjà conforme (casse / accents). */
function exactEnumMatch(raw: string): BuildingType | undefined {
  const foldedInput = foldAscii(raw);
  for (const v of BUILDING_TYPE_VALUES) {
    if (foldAscii(v) === foldedInput) {
      return v;
    }
  }
  return undefined;
}

/**
 * Normalise un libellé libre ou issu de l’IA vers une valeur de liste.
 */
export function normalizeBuildingTypeForLead(raw: string | undefined): BuildingType | undefined {
  if (!raw?.trim()) return undefined;
  const direct = exactEnumMatch(raw.trim());
  if (direct) return direct;

  const f = foldAscii(raw);

  if (/indust|usine|atelier|entrepot|entrepôt|logistique/.test(f)) return "INDUSTRIE";
  if (/tertiaire|bureau|bureaux|immeuble(\s|$)|bureautique/.test(f)) return "TERTIAIRE";
  if (/commerce|commercial|magasin|boutique|retail|espace\s+commercial|grand\s+distribution/.test(f)) {
    return "COMMERCES";
  }
  if (/sport|gymnase|salle\s+de\s+sport|stade|complexe\s+sportif/.test(f)) return "SPORT";
  if (/sante|santé|hopital|hôpital|clinique|medical|médical|ehpad|soins/.test(f)) return "SANTÉ";
  if (/hotel|hôtel|hotellerie|hôtellerie|restaurant|café|cafeteria|résidence\s+touristique/.test(f)) {
    return "HÔTELLERIE";
  }
  if (/enseignement|ecole|école|college|collège|lycee|lycée|universite|université|formation|creche|crèche/.test(f)) {
    return "ENSEIGNEMENT";
  }
  if (/autre|divers|mixte|inconnu|non\s+renseigne/.test(f)) return "AUTRES";

  return undefined;
}

/** Pour formulaire : valeur DB ou texte ancien → code enum ou "" si inconnu. */
export function coerceBuildingTypeForForm(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return "";
  const t = String(raw).trim();
  if ((BUILDING_TYPE_VALUES as readonly string[]).includes(t)) return t;
  return normalizeBuildingTypeForLead(t) ?? "";
}
