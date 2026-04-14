export function getSiteUrl() {
  const fromEnv = import.meta.env.VITE_SITE_URL;
  if (fromEnv && typeof fromEnv === 'string') {
    return fromEnv.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  // Fallback (useful for build-time generation of canonical/schema in static hosting)
  return 'https://destratificateurs.groupe-effinor.fr';
}

export function absoluteUrl(pathname = '/') {
  const base = getSiteUrl();
  if (!base) return '';
  try {
    return new URL(pathname, base).toString();
  } catch {
    return '';
  }
}

