/**
 * Extrait un host de type domaine pour comparaison (sans schéma, sans `www.`).
 */

function stripWww(host: string): string {
  const h = host.toLowerCase();
  return h.startsWith("www.") ? h.slice(4) : h;
}

/**
 * Domaine normalisé pour `normalized_domain` / dédup.
 * Accepte une URL complète ou un host nu (`example.com`).
 */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  const t = input.trim();
  if (!t) {
    return null;
  }
  try {
    const withScheme = t.includes("://") ? t : `https://${t}`;
    const u = new URL(withScheme);
    const host = stripWww(u.hostname);
    return host || null;
  } catch {
    return null;
  }
}
