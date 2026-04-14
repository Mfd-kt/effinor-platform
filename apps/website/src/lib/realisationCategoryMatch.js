/**
 * Filtre les réalisations Airtable par mots-clés de catégorie (insensible à la casse / accents).
 * @param {string | null | undefined} category — champ Category
 * @param {string[]} tokens — ex. ['pac', 'pompe'] pour la page PAC
 */
export function realisationMatchesCategoryTokens(category, tokens) {
  if (category == null || category === '' || !tokens?.length) return false;
  const c = String(category)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return tokens.some((t) => {
    const x = String(t)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return x && c.includes(x);
  });
}
