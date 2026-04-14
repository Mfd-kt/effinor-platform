import { inferEffinorSourceFromPath } from '@/lib/effinorAnalytics';

/**
 * Destination unique du formulaire lead (conversion principale).
 * Tous les CTA primaires pointent vers LEAD_FORM_PATH avec des query params cohérents.
 *
 * Params supportés :
 *   source   — origine logique (ex. pac_page, home, blog)
 *   project  — slug projet pour pré-sélection du sujet (ex. pompe-a-chaleur)
 *   cta      — emplacement du clic (ex. hero, offer_bottom, callback)
 *   page     — pathname de la page d’origine (landing)
 *   slug     — slug article / réalisation
 *   category — catégorie libre (blog, réalisation…)
 */

export const LEAD_FORM_PATH = '/contact';

/** Valeurs du select « Sujet » (Contact.jsx) — alignées Airtable */
export const PROJECT_PARAM_TO_SUJET = {
  'pompe-a-chaleur': 'etude_pac',
  destratification: 'etude_destrat',
  'equilibrage-hydraulique': 'etude_equilibrage',
  cee: 'cee',
  'services-accompagnement': 'etude_accompagnement',
  blog: 'autre',
  realisations: 'autre',
  home: 'autre',
  ressources: 'autre',
  about: 'autre',
  simulateur: 'cee',
};

/** Slug `project` URL → id produit MiniEstimationForm (étape 1) — vide si pas de saut d’étape */
export const PROJECT_PARAM_TO_MINI_PRODUCT = {
  'pompe-a-chaleur': 'pac',
  destratification: 'destrat',
  'equilibrage-hydraulique': 'equil',
};

/**
 * @param {string} project — valeur param `project`
 * @returns {string} pac | destrat | equil | ''
 */
export function miniProductFromProjectParam(project) {
  if (!project) return '';
  return PROJECT_PARAM_TO_MINI_PRODUCT[project] || '';
}

/**
 * @param {string} pathname
 * @returns {string} project slug (vide si inconnu)
 */
export function inferProjectFromPathname(pathname) {
  if (!pathname) return '';
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/pompe-a-chaleur')) return 'pompe-a-chaleur';
  if (pathname.startsWith('/destratification')) return 'destratification';
  if (pathname.startsWith('/equilibrage-hydraulique')) return 'equilibrage-hydraulique';
  if (pathname.startsWith('/cee')) return 'cee';
  if (pathname.startsWith('/services-accompagnement')) return 'services-accompagnement';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname.startsWith('/realisations')) return 'realisations';
  if (pathname.startsWith('/contact')) return 'contact';
  if (pathname.startsWith('/ressources')) return 'ressources';
  if (pathname.startsWith('/a-propos')) return 'about';
  if (pathname.startsWith('/simulateur') || pathname.startsWith('/eligibilite')) return 'simulateur';
  return '';
}

/**
 * Catégorie article / fiche → project slug pour le formulaire
 */
export function inferProjectFromBlogCategory(category) {
  const c = (category || '').toLowerCase().trim();
  if (!c) return 'blog';
  if (c.includes('pac') || c.includes('pompe')) return 'pompe-a-chaleur';
  if (c.includes('déstrat') || c.includes('destrat')) return 'destratification';
  if (c.includes('équilibr') || c.includes('equilibr')) return 'equilibrage-hydraulique';
  if (c.includes('cee')) return 'cee';
  return 'blog';
}

export function inferProjectFromRealisationCategory(category) {
  const c = (category || '').toLowerCase().trim();
  if (!c) return 'realisations';
  if (c.includes('pac') || c.includes('pompe') || c.includes('chaleur')) return 'pompe-a-chaleur';
  if (c.includes('déstrat') || c.includes('destrat')) return 'destratification';
  if (c.includes('équilibr') || c.includes('equilibr') || c.includes('hydraul')) return 'equilibrage-hydraulique';
  if (c.includes('cee')) return 'cee';
  return 'realisations';
}

/**
 * @param {object} opts
 * @param {string} [opts.source]
 * @param {string} [opts.project]
 * @param {string} [opts.cta]
 * @param {string} [opts.page]
 * @param {string} [opts.slug]
 * @param {string} [opts.category]
 * @returns {string} path avec query string (ex. /contact?source=…)
 */
export function buildLeadFormHref(opts = {}) {
  const q = new URLSearchParams();
  const source = opts.source ?? '';
  const project = opts.project ?? '';
  const cta = opts.cta ?? '';
  if (source) q.set('source', source);
  if (project) q.set('project', project);
  if (cta) q.set('cta', cta);
  if (opts.page) q.set('page', opts.page);
  if (opts.slug) q.set('slug', opts.slug);
  if (opts.category) q.set('category', opts.category);
  const s = q.toString();
  return s ? `${LEAD_FORM_PATH}?${s}` : LEAD_FORM_PATH;
}

/**
 * Parse l’URL du formulaire pour préremplissage
 * @param {string} search — location.search
 */
export function parseLeadFormQuery(search) {
  const raw = typeof search === 'string' && search.startsWith('?') ? search.slice(1) : search || '';
  const params = new URLSearchParams(raw);
  const get = (k) => params.get(k) || '';
  return {
    source: get('source'),
    project: get('project'),
    cta: get('cta'),
    page: get('page'),
    slug: get('slug'),
    category: get('category'),
  };
}

/**
 * CTA vers le formulaire depuis la page courante (source + project déduits du pathname).
 */
export function buildLeadFormHrefForPage(pathname, { cta = 'inline', slug = '', category = '', source: sourceOverride } = {}) {
  return buildLeadFormHref({
    source: sourceOverride || inferEffinorSourceFromPath(pathname),
    project: inferProjectFromPathname(pathname),
    cta,
    page: pathname,
    slug,
    category,
  });
}

/**
 * Déduit le sujet (value select) depuis project + cta
 */
export function resolveSujetFromQuery({ project, cta }) {
  if (cta === 'callback' || cta === 'rappel' || (typeof cta === 'string' && cta.endsWith('_callback'))) {
    return 'rappel';
  }
  if (!project) return '';
  return PROJECT_PARAM_TO_SUJET[project] || '';
}
