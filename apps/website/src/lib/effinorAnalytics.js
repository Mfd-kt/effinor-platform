/**
 * Effinor — analytics conversion (dataLayer GTM + GA4 optionnel)
 *
 * --- Événements (event = clé `event` dans dataLayer) ---
 *
 * CTA
 *   effinor_cta_study          Clic vers étude / formulaire complet (Demander une étude, Obtenir mon étude…)
 *   effinor_cta_callback       Clic « Être rappelé » / contact pour rappel
 *
 * Formulaire long (/formulaire-complet)
 *   effinor_form_long_open      Formulaire affiché avec lead valide (ouverture session)
 *   effinor_form_step_complete  Étape validée (suivant) — params: form_step 1–3
 *   effinor_form_submit_success Envoi final réussi
 *   effinor_form_submit_error   Échec envoi (optionnel)
 *
 * Mini-formulaire accueil
 *   effinor_mini_form_view      Carte formulaire hero affichée (mount)
 *   effinor_mini_form_submit    Soumission réussie avant redirection formulaire complet
 *
 * Contact
 *   effinor_phone_click         Clic tel: (+33978455063)
 *   effinor_email_click         Clic mailto (contact, devis…)
 *
 * Offres PAC / déstrat
 *   effinor_offer_page_view     Vue d’une page filière (première entrée sur URL offre)
 *
 * Business (CRM / pipeline — effinor_event_origin: crm, contournent le bandeau cookies)
 *   effinor_lead_qualified       Lead qualifié (statut pipeline, ex. code QUALIFIE)
 *   effinor_meeting_booked       RDV / entretien planifié (code RDV*, MEETING*, etc.)
 *   effinor_quote_sent           Devis envoyé
 *   effinor_quote_signed         Affaire signée / statut gagné (is_won)
 *   effinor_project_value        Montant projet / CEE saisi ou mis à jour (value en €)
 *
 * Abandon formulaire long (site uniquement, soumis au consentement)
 *   effinor_form_abandon         Sortie page ou inactivité &gt; 30 s avant envoi
 *
 * --- Paramètres communs (tous les events) ---
 *   effinor_type_projet   'pac' | 'destrat' | 'mixte' | '' (si inconnu)
 *   effinor_source        home | form_long | contact | footer | header | …
 *   effinor_device        mobile | desktop (tablette → mobile)
 *   effinor_page          pathname (ex. /pompe-a-chaleur)
 *
 * Paramètres additionnels fréquents :
 *   effinor_cta_location  hero | final_cta | offer_block | footer | top_banner | floating | header | …
 *   effinor_form_step     1 | 2 | 3 (pour step_complete)
 *   effinor_form_step_label
 *   effinor_offer        pac | destrat (pour offer_page_view)
 *   effinor_offer_segment hub | residentiel | tertiaire | industriel
 *   effinor_email_target contact | devis | …
 *   effinor_event_origin site | crm
 *   lead_id               UUID lead (business + abandon)
 *   value                 nombre (€) pour effinor_project_value ou signés
 *   effinor_abandon_reason page_exit | inactive_30s
 *   effinor_form_step      étape courante lors de l’abandon
 *
 * Config (.env) :
 *   VITE_GTM_ID              Ex. GTM-XXXXXXX  (recommandé)
 *   VITE_GA_MEASUREMENT_ID   Ex. G-XXXXXXXXXX (si chargement direct GA4 sans GTM)
 */

const FORM_STORAGE_KEY = 'cee_eligibility_form_data';

let gtmInjected = false;
let gaInjected = false;

export function hasAnalyticsConsent() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return localStorage.getItem('cookie-consent') === 'accepted';
}

/** Largeur < 1024px → mobile (tablette incluse pour le funnel). */
export function getEffinorDevice() {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 1024 ? 'mobile' : 'desktop';
}

export function inferEffinorSourceFromPath(pathname) {
  if (!pathname) return 'unknown';
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/formulaire-complet')) return 'form_long';
  if (pathname.startsWith('/contact')) return 'contact';
  if (pathname.startsWith('/pompe-a-chaleur')) return 'pac_page';
  if (pathname.startsWith('/destratification')) return 'destrat_page';
  if (pathname.startsWith('/equilibrage-hydraulique')) return 'equilibrage_page';
  if (pathname.startsWith('/cee')) return 'cee_page';
  if (pathname.startsWith('/services-accompagnement')) return 'services_page';
  if (pathname.startsWith('/blog')) return 'blog';
  if (pathname.startsWith('/realisations')) return 'realisations';
  if (pathname.startsWith('/ressources')) return 'ressources';
  if (pathname.startsWith('/secteurs-activite')) return 'secteurs';
  if (pathname.startsWith('/a-propos')) return 'about';
  if (pathname.startsWith('/merci')) return 'thank_you';
  return 'other';
}

/** type_projet depuis localStorage (mini-form ou formulaire long sauvegardé) */
export function getStoredTypeProjet() {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return '';
    const d = JSON.parse(raw);
    if (d.projectType === 'pac' || d.projectType === 'destrat') return d.projectType;
    const b = d.besoin_principal;
    if (typeof b === 'string') {
      if (b.startsWith('pac')) return 'pac';
      if (b.startsWith('destrat')) return 'destrat';
      if (b === 'mixte') return 'mixte';
    }
  } catch {
    /* ignore */
  }
  return '';
}

function basePayload(extra = {}) {
  const page = typeof window !== 'undefined' ? window.location.pathname : '';
  return {
    effinor_type_projet: extra.effinor_type_projet ?? getStoredTypeProjet() ?? '',
    effinor_source: extra.effinor_source ?? inferEffinorSourceFromPath(page),
    effinor_device: extra.effinor_device ?? getEffinorDevice(),
    effinor_page: extra.effinor_page ?? page,
    ...extra,
  };
}

/**
 * Push dataLayer + event GA4 si gtag disponible et VITE_GA_MEASUREMENT_ID défini.
 * Les événements avec effinor_event_origin === 'crm' sont envoyés même sans cookie marketing
 * (activité interne back-office).
 */
export function trackEffinorEvent(eventName, params = {}) {
  const isCrm = params.effinor_event_origin === 'crm';
  if (!isCrm && !hasAnalyticsConsent()) return;
  if (isCrm) initEffinorAnalytics({ force: true });

  const { effinor_type_projet, effinor_source, effinor_device, effinor_page, ...rest } = basePayload(params);

  const dlPayload = {
    event: eventName,
    effinor_type_projet,
    effinor_source,
    effinor_device,
    effinor_page,
    ...rest,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(dlPayload);

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof window.gtag === 'function' && gaId) {
    const gtagPayload = {
      effinor_type_projet,
      effinor_source,
      effinor_device,
      effinor_page,
      ...rest,
    };
    if (typeof rest.value === 'number' && !Number.isNaN(rest.value)) {
      gtagPayload.value = rest.value;
    }
    window.gtag('event', eventName, gtagPayload);
  }
}

export function trackCtaStudy(overrides = {}) {
  trackEffinorEvent('effinor_cta_study', {
    effinor_cta_kind: 'study',
    ...overrides,
  });
}

export function trackCtaCallback(overrides = {}) {
  trackEffinorEvent('effinor_cta_callback', {
    effinor_cta_kind: 'callback',
    ...overrides,
  });
}

export function trackPhoneClick(overrides = {}) {
  trackEffinorEvent('effinor_phone_click', { ...overrides });
}

export function trackEmailClick(overrides = {}) {
  trackEffinorEvent('effinor_email_click', { ...overrides });
}

export function trackFormLongOpen(overrides = {}) {
  trackEffinorEvent('effinor_form_long_open', {
    effinor_source: 'form_long',
    ...overrides,
  });
}

export function trackFormStepComplete(step, stepLabel, overrides = {}) {
  trackEffinorEvent('effinor_form_step_complete', {
    effinor_source: 'form_long',
    effinor_form_step: step,
    effinor_form_step_label: stepLabel,
    ...overrides,
  });
}

export function trackFormSubmitSuccess(overrides = {}) {
  trackEffinorEvent('effinor_form_submit_success', {
    effinor_source: 'form_long',
    ...overrides,
  });
}

export function trackFormSubmitError(overrides = {}) {
  trackEffinorEvent('effinor_form_submit_error', {
    effinor_source: 'form_long',
    ...overrides,
  });
}

export function trackMiniFormView(overrides = {}) {
  trackEffinorEvent('effinor_mini_form_view', {
    effinor_source: 'home',
    effinor_cta_location: 'hero',
    ...overrides,
  });
}

export function trackMiniFormSubmit(overrides = {}) {
  trackEffinorEvent('effinor_mini_form_submit', {
    effinor_source: 'home',
    ...overrides,
  });
}

export function trackProductCardClick(overrides = {}) {
  trackEffinorEvent('effinor_product_card_click', {
    effinor_source: 'home',
    effinor_cta_location: 'hero_form',
    ...overrides,
  });
}

export function trackFormStepAbandoned(overrides = {}) {
  trackEffinorEvent('effinor_form_abandon', {
    effinor_source: 'home',
    effinor_cta_location: 'hero_form',
    ...overrides,
  });
}

export function trackOfferPageView({ offer, segment, page }) {
  trackEffinorEvent('effinor_offer_page_view', {
    effinor_offer: offer,
    effinor_offer_segment: segment,
    effinor_page: page,
    effinor_source: offer === 'pac' ? 'pac_page' : 'destrat_page',
  });
}

/** @param {string} [params.currency] défaut EUR */
export function trackLeadQualified(params = {}) {
  trackEffinorEvent('effinor_lead_qualified', { effinor_event_origin: 'crm', ...params });
}

export function trackMeetingBooked(params = {}) {
  trackEffinorEvent('effinor_meeting_booked', { effinor_event_origin: 'crm', ...params });
}

export function trackQuoteSent(params = {}) {
  trackEffinorEvent('effinor_quote_sent', { effinor_event_origin: 'crm', ...params });
}

export function trackQuoteSigned(params = {}) {
  trackEffinorEvent('effinor_quote_signed', { effinor_event_origin: 'crm', ...params });
}

/** @param {number} value montant (ex. € TTC ou montant CEE selon usage interne) */
export function trackProjectValue({ value, lead_id, ...rest }) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  trackEffinorEvent('effinor_project_value', {
    effinor_event_origin: 'crm',
    value: Number.isFinite(num) ? num : undefined,
    lead_id,
    currency: 'EUR',
    ...rest,
  });
}

/**
 * Abandon du formulaire long (public).
 * @param {'page_exit'|'inactive_30s'} reason
 */
export function trackFormAbandon(reason, { formStep = 1, lead_id = '', ...rest } = {}) {
  trackEffinorEvent('effinor_form_abandon', {
    effinor_source: 'form_long',
    effinor_abandon_reason: reason,
    effinor_form_step: formStep,
    lead_id,
    ...rest,
  });
}

function injectGtm(id) {
  if (gtmInjected || typeof document === 'undefined') return;
  gtmInjected = true;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${id}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.appendChild(noscript);
}

function injectGtag(gaId) {
  if (gaInjected || typeof document === 'undefined') return;
  const gtmId = import.meta.env.VITE_GTM_ID;
  if (gtmId) return;

  gaInjected = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', gaId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
}

/**
 * @param {{ force?: boolean }} options — force=true charge GTM/GA même sans consentement (usage CRM / events métier internes).
 */
export function initEffinorAnalytics(options = {}) {
  const { force = false } = options;
  if (typeof window === 'undefined') return;
  if (!force && !hasAnalyticsConsent()) return;

  const gtmId = import.meta.env.VITE_GTM_ID;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (gtmId) injectGtm(gtmId);
  else if (gaId) injectGtag(gaId);
}

export function bootstrapEffinorAnalyticsListeners() {
  if (typeof window === 'undefined') return;

  const tryInit = () => {
    if (hasAnalyticsConsent()) initEffinorAnalytics();
  };

  tryInit();
  window.addEventListener('cookie-consent', (e) => {
    if (e?.detail?.status === 'accepted') initEffinorAnalytics();
  });
}
