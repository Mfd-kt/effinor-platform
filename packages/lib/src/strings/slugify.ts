/**
 * Transforme une chaîne en slug URL-safe.
 *
 * @example
 *   slugify('Rénovation Énergétique')   // "renovation-energetique"
 *   slugify('  Hello  World !  ')        // "hello-world"
 *   slugify('BAR-TH-174 : Rénovation')   // "bar-th-174-renovation"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
