import { normalizeDomain } from "@/features/lead-generation/lib/normalize-domain";

/**
 * Extrait un domaine depuis un email du type contact@example.com.
 */
export function domainFromEmail(email: string): string | null {
  const t = email.trim();
  const at = t.indexOf("@");
  if (at <= 0 || at === t.length - 1) return null;
  const host = t.slice(at + 1).trim();
  return normalizeDomain(host);
}

/**
 * Heuristique locale : nom d’entreprise (+ ville) → slug `.fr` (sans vérification DNS).
 * Dernier recours si pas de site, pas de domaine normalisé, pas d’email exploitable.
 */
export function inferLikelyDomainFr(companyName: string, city: string | null): string | null {
  let s = companyName.toLowerCase().trim();
  s = s.replace(/\s+(sasu|sas|sarl|eurl|sa|sci|snc)(\.|\b)\s*$/gi, " ").trim();
  s = s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (city?.trim()) {
    const c = city
      .trim()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (c.length >= 2 && c.length <= 24) {
      s = `${s}-${c}`;
    }
  }
  s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 56);
  if (s.length < 3) return null;
  return `${s}.fr`;
}

/**
 * Résout un domaine pour enrichissement : site → email → colonne normalisée → heuristique.
 */
export function resolveEnrichmentDomain(input: {
  website: string | null;
  email: string | null;
  normalized_domain: string | null;
  company_name: string;
  city: string | null;
}): string | null {
  const fromWeb = normalizeDomain(input.website);
  if (fromWeb) return fromWeb;

  const fromMail = input.email?.trim() ? domainFromEmail(input.email!) : null;
  if (fromMail) return fromMail;

  if (input.normalized_domain?.trim()) {
    const h = input.normalized_domain.trim().toLowerCase();
    const withScheme = h.includes("://") ? h : `https://${h}`;
    return normalizeDomain(withScheme);
  }

  return inferLikelyDomainFr(input.company_name, input.city);
}
