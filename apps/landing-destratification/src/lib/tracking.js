/**
 * CRO / GA4 tracking via GTM dataLayer.
 * Events: landing_view, step1_start, step1_submit, step2_start, lead_submit,
 *         click_call, scroll_50, scroll_75, faq_open.
 */

const UTM_STORAGE_KEY = 'effinor_utms';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'];

/**
 * Lit les paramètres UTM et gclid depuis l'URL et les persiste en localStorage.
 * À appeler une fois au chargement de l'app (ex. dans App.jsx).
 */
export function captureUtms() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const stored = {};
  let hasAny = false;
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      stored[key] = value;
      hasAny = true;
    }
  }
  if (hasAny) {
    try {
      window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(stored));
    } catch (_) {}
  }
}

/**
 * Retourne l'objet UTM/gclid stocké (pour lead_submit).
 */
export function getStoredUtms() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

/**
 * Pousse un événement vers GTM dataLayer et gtag si présent.
 * @param {string} name - Nom de l'événement (landing_view, step1_start, etc.)
 * @param {Record<string, unknown>} params - Paramètres de l'événement
 */
export function pushEvent(name, params = {}) {
  if (typeof window === 'undefined') return;
  const payload = { event: name, ...params };
  try {
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }
  } catch (_) {}
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch (_) {}
}
