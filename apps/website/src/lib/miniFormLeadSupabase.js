import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

/** Client réel (anon) — distinct du mock `supabaseClient.js` utilisé ailleurs. */
let browserClient = null;

function getAnonClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key || String(url).includes('your-project')) return null;
  if (!browserClient) {
    browserClient = createClient(url, key);
  }
  return browserClient;
}

/**
 * Insert Supabase activé si URL + clé anon sont définies.
 * Désactiver explicitement : VITE_DISABLE_SUPABASE_MINI_FORM_INSERT=true
 */
export function isMiniFormSupabaseInsertEnabled() {
  if (import.meta.env.VITE_DISABLE_SUPABASE_MINI_FORM_INSERT === 'true') return false;
  return !!getAnonClient();
}

function splitFullName(fullName) {
  const t = (fullName || '').trim();
  if (!t) return { first_name: '', last_name: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

/** UUID v4 côté navigateur — évite `.select()` après insert (RLS SELECT souvent fermée pour `anon`). */
function newLeadId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  throw new Error('crypto indisponible pour générer un id de lead');
}

/**
 * Insert une ligne `public.leads` depuis les données déjà sanitizées du mini-formulaire.
 * La valeur `source` doit exister dans l’enum Postgres `lead_source` (ex. ajuster via migration).
 *
 * RLS : prévoir une policy INSERT pour le rôle `anon` sur `public.leads`, ou passer par une Edge Function service_role.
 */
export async function insertMiniFormLeadFromSanitized(sanitizedData) {
  const supabase = getAnonClient();
  if (!supabase) {
    return { success: false, error: 'Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)', id: null };
  }

  const fd = sanitizedData.formulaire_data ?? {};
  const attribution = sanitizedData.attribution ?? {};
  const { first_name, last_name } = splitFullName(sanitizedData.nom);

  const leadSource =
    import.meta.env.VITE_LEAD_SOURCE_MINI_FORM ||
    import.meta.env.VITE_LEAD_SOURCE_DEFAULT ||
    'website';

  const societe = (sanitizedData.societe || '').trim();
  const worksiteCity = (sanitizedData.worksite_city || '').trim();

  const simPayload = {
    mini_form: true,
    type_projet: sanitizedData.type_projet || null,
    besoin_principal: fd.besoin_principal ?? null,
    besoin_principal_label: fd.besoin_principal_label ?? null,
    contexte_pac: fd.contexte_pac ?? null,
    contexte_destrat: fd.contexte_destrat ?? null,
    contexte_equil: fd.contexte_equil ?? null,
    effinor_product: fd.effinor_product ?? null,
    effinor_attr: {
      source: attribution.source || null,
      project: attribution.project || null,
      cta: attribution.cta || null,
      page: attribution.page || null,
      slug: attribution.slug || null,
      category: attribution.category || null,
    },
  };

  const id = newLeadId();

  const row = {
    id,
    source: leadSource,
    campaign: attribution.cta || null,
    landing: attribution.page || null,
    product_interest: null,
    company_name: societe || 'Non renseigné',
    first_name: first_name || null,
    last_name: last_name || null,
    contact_name: sanitizedData.nom || null,
    phone: sanitizedData.telephone,
    email: sanitizedData.email,
    worksite_address: '',
    worksite_postal_code: sanitizedData.worksite_postal_code,
    worksite_city: worksiteCity || 'À compléter',
    building_type: sanitizedData.type_batiment,
    surface_m2: sanitizedData.surface_m2,
    heating_type: sanitizedData.heating_type || null,
    lead_origin: 'mini_estimation_form',
    sim_payload_json: simPayload,
  };

  const { error } = await supabase.from('leads').insert([row]);

  if (error) {
    logger.error('[miniFormLeadSupabase] insert error', error);
    return { success: false, error: error.message || String(error), id: null };
  }

  return { success: true, error: null, id };
}

const CONTACT_SUJET_LABELS = {
  etude_pac: 'Étude pompe à chaleur',
  etude_destrat: 'Étude déstratification',
  etude_equilibrage: 'Étude équilibrage hydraulique',
  etude_accompagnement: 'Accompagnement projet / multi-leviers',
  cee: 'Optimisation / financement CEE',
  devis: 'Demande de devis',
  rappel: 'Demande de rappel',
  partenariat: 'Partenariat',
  autre: 'Autre',
};

/**
 * Page /contact — formulaire « Décrivez votre projet » → `public.leads`.
 * Chantier non saisi : CP / ville placeholders documentés dans `recording_notes`.
 */
export async function insertContactPageLeadFromSanitized(payload) {
  const supabase = getAnonClient();
  if (!supabase) {
    return { success: false, error: 'Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)', id: null };
  }

  const attr = payload.attribution ?? {};
  const { first_name, last_name } = splitFullName(payload.nom);
  const sujet = (payload.sujet || '').trim();
  const sujetLabel = CONTACT_SUJET_LABELS[sujet] || sujet || null;
  const societe = (payload.societe || '').trim();
  const phone = (payload.telephone || '').trim() || null;

  const leadSource =
    import.meta.env.VITE_LEAD_SOURCE_CONTACT ||
    import.meta.env.VITE_LEAD_SOURCE_MINI_FORM ||
    import.meta.env.VITE_LEAD_SOURCE_DEFAULT ||
    'website';

  const linesAttr = [
    payload.message || '',
    '',
    '--- Métadonnées (page contact) ---',
    `source: ${attr.source || '—'}`,
    `project: ${attr.project || '—'}`,
    `cta: ${attr.cta || '—'}`,
    `page: ${attr.page || '—'}`,
    `slug: ${attr.slug || '—'}`,
    `category: ${attr.category || '—'}`,
    '',
    'Chantier : non renseigné (formulaire contact — pas de CP saisi).',
  ];
  const recording_notes = linesAttr.join('\n');

  const simPayload = {
    contact_form: true,
    sujet,
    sujet_label: sujetLabel,
    contact_sujet_label: sujetLabel,
    effinor_attr: {
      source: attr.source || null,
      project: attr.project || null,
      cta: attr.cta || null,
      page: attr.page || null,
      slug: attr.slug || null,
      category: attr.category || null,
    },
  };

  const id = newLeadId();

  const row = {
    id,
    source: leadSource,
    campaign: attr.cta || null,
    landing: attr.page || null,
    product_interest: null,
    company_name: societe || 'Non renseigné',
    first_name: first_name || null,
    last_name: last_name || null,
    contact_name: payload.nom || null,
    phone,
    email: payload.email,
    worksite_address: '',
    worksite_postal_code: '00000',
    worksite_city: 'Non renseigné (page contact)',
    lead_origin: 'contact_page',
    recording_notes,
    sim_payload_json: simPayload,
  };

  const { error } = await supabase.from('leads').insert([row]);

  if (error) {
    logger.error('[miniFormLeadSupabase] contact page insert error', error);
    return { success: false, error: error.message || String(error), id: null };
  }

  return { success: true, error: null, id };
}
