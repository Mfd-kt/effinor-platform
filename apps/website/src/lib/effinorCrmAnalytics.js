import {
  trackLeadQualified,
  trackMeetingBooked,
  trackQuoteSent,
  trackQuoteSigned,
  trackProjectValue,
} from '@/lib/effinorAnalytics';

/**
 * Déduit pac | destrat | mixte | '' depuis une ligne lead CRM.
 */
export function typeProjetFromLead(lead) {
  if (!lead) return '';
  const tp = String(lead.type_projet || '').toLowerCase();
  if (tp.includes('déstrat') || tp.includes('destrat') || tp.includes('déstratificateur')) return 'destrat';
  if (tp.includes('pompe') || tp.includes('pac')) return 'pac';

  try {
    const fd = lead.formulaire_data;
    const parsed = typeof fd === 'string' ? JSON.parse(fd) : fd;
    if (parsed?.projectType === 'pac' || parsed?.projectType === 'destrat') return parsed.projectType;
    const b = parsed?.besoin_principal || parsed?.qualification?.projectType;
    if (b === 'mixte') return 'mixte';
    if (typeof b === 'string') {
      if (b.startsWith('pac')) return 'pac';
      if (b.startsWith('destrat')) return 'destrat';
    }
  } catch {
    /* ignore */
  }
  return '';
}

function normalizeStatusCode(code) {
  if (!code) return '';
  return String(code)
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Émet au plus un événement métier majeur par changement de statut (priorité pipeline).
 * À adapter dans GTM si vos codes lead_statuses diffèrent (see effinor_status_code dans le dataLayer).
 *
 * @param {object} lead - ligne lead avec id, type_projet, formulaire_data, page_origine
 * @param {object} status - { code, label, is_won } depuis la jointure status_id
 */
export function emitCrmBusinessEventsForStatusChange(lead, status) {
  if (!lead?.id || !status) return;

  const code = normalizeStatusCode(status.code);
  const label = (status.label || '').toLowerCase();

  const base = {
    lead_id: lead.id,
    effinor_type_projet: typeProjetFromLead(lead),
    effinor_source: 'crm',
    effinor_page: typeof window !== 'undefined' ? window.location.pathname : '/admin/leads',
    effinor_status_code: status.code || '',
    effinor_status_label: status.label || '',
  };

  if (status.is_won) {
    trackQuoteSigned({ ...base });
    return;
  }

  if (code.includes('GAGNE') || label.includes('gagné') || label.includes('gagne')) {
    trackQuoteSigned({ ...base });
    return;
  }

  if (
    (code.includes('DEVIS') && (code.includes('ENVOY') || code.includes('ENVOYE'))) ||
    label.includes('devis envoyé') ||
    label.includes('devis envoye')
  ) {
    trackQuoteSent({ ...base });
    return;
  }

  if (
    code.includes('RDV') ||
    code.includes('MEETING') ||
    code.includes('RENDEZ') ||
    code.includes('ENTRETIEN') ||
    label.includes('rdv') ||
    label.includes('rendez') ||
    label.includes('meeting') ||
    label.includes('entretien planif')
  ) {
    trackMeetingBooked({ ...base });
    return;
  }

  if (code.includes('QUALIF') || label.includes('qualifi')) {
    trackLeadQualified({ ...base });
  }
}

/**
 * Valeur projet / CEE mise à jour depuis le CRM.
 */
export function emitCrmProjectValue(lead, numericValue, sourceField = 'montant_cee_estime') {
  if (!lead?.id) return;
  const n = typeof numericValue === 'number' ? numericValue : parseFloat(numericValue);
  if (!Number.isFinite(n)) return;

  trackProjectValue({
    lead_id: lead.id,
    value: n,
    effinor_type_projet: typeProjetFromLead(lead),
    effinor_source: 'crm',
    effinor_value_field: sourceField,
    effinor_page: typeof window !== 'undefined' ? window.location.pathname : '/admin/leads',
  });
}
