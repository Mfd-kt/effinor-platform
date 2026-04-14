/**
 * URL publique du site (canonical, OG, JSON-LD).
 * Surchargeable via VITE_SITE_URL en déploiement (staging, préprod).
 */
const FALLBACK_SITE = 'https://effinor.fr';

export function getSiteUrl() {
  const raw = import.meta.env?.VITE_SITE_URL;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.replace(/\/$/, '');
  }
  return FALLBACK_SITE;
}

/**
 * @param {string} pathnameWithSearch - ex: `/blog` ou `/blog?page=2`
 */
export function getAbsoluteUrl(pathnameWithSearch = '/') {
  const base = getSiteUrl();
  if (!pathnameWithSearch || pathnameWithSearch === '') {
    return `${base}/`;
  }
  const path = pathnameWithSearch.startsWith('/') ? pathnameWithSearch : `/${pathnameWithSearch}`;
  return `${base}${path}`;
}

/** Image OG / Twitter par défaut (alignée sur SEOHead) */
export const DEFAULT_OG_IMAGE = 'https://i.ibb.co/6rT1m18/logo-ecps.png';
