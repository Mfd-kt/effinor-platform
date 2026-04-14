/** Sans accents, minuscules — pour tests de mots-clés. */
function foldAscii(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Libellés courts et homogènes pour « Intérêt produit » (ERP).
 * Ordre : déstrat → PAC → luminaire/LED → texte d’origine (tronqué).
 * Aligné sur le prompt d’analyse d’appel / IA.
 */
export function normalizeProductInterestLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const f = foldAscii(trimmed);

  if (/destratif|destratification|\bdestrat\b/.test(f)) {
    return "Destratificateur";
  }
  if (/pompe\s+a\s+chaleur|\bpac\b|chaudiere/.test(f)) {
    return "PAC";
  }
  if (/luminaire|\bleds?\b/.test(f)) {
    return "Luminaire LED";
  }

  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed;
}
