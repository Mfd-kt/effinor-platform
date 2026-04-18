/**
 * Normalisation pour rapprochement anti-doublons uniquement (distinct de l’affichage).
 * Prudente : suffixes juridiques courants retirés en fin de chaîne, ponctuation allégée.
 */

const LEGAL_SUFFIXES = new Set([
  "sarl",
  "sas",
  "sasu",
  "eurl",
  "sci",
  "sa",
  "snc",
  "selarl",
  "selas",
]);

/**
 * Retourne une clé de matching stable (minuscules, sans accents sur lettres courantes, sans suffixe juridique terminal répété).
 */
export function normalizeCompanyNameForMatching(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  let s = input
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  s = s.replace(/[.,;:'"«»()]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (!s) {
    return null;
  }

  const parts = s.split(/\s+/);
  while (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (LEGAL_SUFFIXES.has(last)) {
      parts.pop();
      continue;
    }
    break;
  }
  s = parts.join(" ").trim();
  return s || null;
}

/**
 * Deux noms sont « proches » si la clé de matching est identique, ou si l’un contient l’autre (longueur minimale sur le plus court).
 */
export function areCompanyNamesSimilarForDedup(
  nameA: string | null | undefined,
  nameB: string | null | undefined,
): boolean {
  const ka = normalizeCompanyNameForMatching(nameA);
  const kb = normalizeCompanyNameForMatching(nameB);
  if (!ka || !kb) {
    return false;
  }
  if (ka === kb) {
    return true;
  }
  const short = ka.length <= kb.length ? ka : kb;
  const long = ka.length <= kb.length ? kb : ka;
  if (short.length < 5) {
    return false;
  }
  return long.includes(short);
}
