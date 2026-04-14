// src/utils/productSpecs.js

/**
 * Utilitaire centralisant la logique métier des fiches produits :
 * - Mapping catégorie → type interne (luminaire, destratificateur, autre)
 * - Schémas de champs spécifiques pour l'admin
 * - Normalisation et résumé des caractéristiques techniques
 */

const LUMINAIRE_KEYS = {
  flux_lumineux_lm: ['flux_lumineux', 'flux_lumineux_lm', 'flux', 'lumens', 'luminosite', 'flux_lm'],
  puissance_w: ['puissance_w', 'puissance', 'watt', 'watts', 'puissance_nominale'],
  efficacite_lm_w: ['efficacite', 'efficacite_lm_w', 'lm_w', 'lmparw'],
  duree_vie_h: ['duree_vie', 'duree_vie_h', 'lifetime', 'duree_l80', 'duree_l80_b10'],
};

const DESTRAT_KEYS = {
  debit_air_m3_h: ['debit_air', 'debit_air_m3_h', 'debit', 'airflow', 'debit_m3_h'],
  niveau_bruit_db: ['niveau_sonore', 'niveau_bruit', 'bruit', 'sonore_db'],
  portee_max_m: ['portee_max', 'portee', 'portee_m', 'range'],
  puissance_moteur_w: ['puissance_moteur', 'puissance_moteur_w', 'moteur_w'],
};

const numberFormatters = new Map();

function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const key = JSON.stringify(options);
  if (!numberFormatters.has(key)) {
    numberFormatters.set(key, new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0, ...options }));
  }
  return numberFormatters.get(key).format(value);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const sanitized = String(value)
    .replace(/\s/g, '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  if (!sanitized) return null;
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCaracteristiques(caracteristiques) {
  if (!caracteristiques) return null;
  if (typeof caracteristiques === 'string') {
    try {
      const parsed = JSON.parse(caracteristiques);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof caracteristiques === 'object') {
    return caracteristiques;
  }
  return null;
}

function pickValue(keys, sources) {
  for (const key of keys) {
    for (const source of sources) {
      if (source && source[key] !== undefined && source[key] !== null && source[key] !== '') {
        return source[key];
      }
    }
  }
  return undefined;
}

function formatLabelFromKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getCategoryType(categorie) {
  if (!categorie) return null;
  const normalized = String(categorie).toLowerCase().trim();
  if (normalized.includes('luminaire') || normalized.includes('éclairage') || normalized.includes('eclairage') || normalized.includes('led')) {
    return 'luminaire';
  }
  if (normalized.includes('destrat') || normalized.includes('déstrat') || normalized.includes('brasseur')) {
    return 'destratificateur';
  }
  return null;
}

export function getCategorySpecSchema(categorie) {
  const type = getCategoryType(categorie);
  if (type === 'luminaire') {
    return {
      type: 'luminaire',
      label: 'Luminaire',
      fields: [
        { key: 'flux_lumineux_lm', label: 'Flux lumineux', unit: 'lm', inputType: 'number', hero: true, order: 1 },
        { key: 'puissance_w', label: 'Puissance', unit: 'W', inputType: 'number', hero: true, order: 2 },
        { key: 'efficacite_lm_w', label: 'Efficacité lumineuse', unit: 'lm/W', inputType: 'number', order: 3 },
        { key: 'duree_vie_h', label: 'Durée de vie (L80 B10)', unit: 'h', inputType: 'number', hero: true, order: 4 },
        { key: 'materiaux', label: 'Matériaux', unit: '', inputType: 'text', order: 5 },
        { key: 'temperature_couleur', label: 'Température de couleur', unit: 'K', inputType: 'text', order: 6 },
        { key: 'indice_rendu_couleurs', label: 'Indice de rendu des couleurs', unit: 'CRI', inputType: 'text', order: 7 },
        { key: 'commande_controle', label: 'Commande / Contrôle', unit: '', inputType: 'text', order: 8 },
        { key: 'tension_entree', label: 'Tension d\'entrée', unit: '', inputType: 'text', order: 9 },
        { key: 'angle_faisceau', label: 'Angle de faisceau', unit: '°', inputType: 'text', order: 10 },
        { key: 'protection', label: 'Protection', unit: '', inputType: 'text', order: 11 },
        { key: 'installation', label: 'Installation', unit: '', inputType: 'text', order: 12 },
        { key: 'dimensions', label: 'Dimensions', unit: '', inputType: 'text', order: 13 },
        { key: 'poids_net', label: 'Poids net', unit: 'kg', inputType: 'text', order: 14 },
      ],
    };
  }
  if (type === 'destratificateur') {
    return {
      type: 'destratificateur',
      label: "Destratificateur d'air",
      fields: [
        { key: 'niveau_bruit_db', label: 'Niveau sonore', unit: 'dB(A)', inputType: 'number', hero: true, order: 1 },
        { key: 'debit_air_m3_h', label: "Débit d’air", unit: 'm³/h', inputType: 'number', hero: true, order: 2 },
        { key: 'portee_max_m', label: 'Portée maximale', unit: 'm', inputType: 'number', order: 3 },
        { key: 'puissance_moteur_w', label: 'Puissance moteur AC', unit: 'W', inputType: 'number', hero: true, order: 4 },
      ],
    };
  }
  return { type: null, label: null, fields: [] };
}

export function buildCaracteristiquesPayload(categorie, rawValues = {}) {
  const schema = getCategorySpecSchema(categorie);
  if (!schema.type || !schema.fields.length) {
    return { type_spec: null, ...rawValues };
  }

  const payload = { type_spec: schema.type };
  schema.fields.forEach((field) => {
    const rawKey = field.key;
    const raw = rawValues[rawKey];
    const num = toNumberOrNull(raw);
    payload[rawKey] = num !== null ? num : raw ?? null;
  });
  return payload;
}

export function normalizeCaracteristiques(product = {}) {
  const parsed = parseCaracteristiques(product.caracteristiques);
  const sources = [parsed || {}, product || {}];

  const specs = {
    flux_lumineux_lm: toNumberOrNull(pickValue(LUMINAIRE_KEYS.flux_lumineux_lm, sources)),
    puissance_w: toNumberOrNull(pickValue(LUMINAIRE_KEYS.puissance_w, sources)) ?? toNumberOrNull(product.puissance),
    efficacite_lm_w: toNumberOrNull(pickValue(LUMINAIRE_KEYS.efficacite_lm_w, sources)),
    duree_vie_h: toNumberOrNull(pickValue(LUMINAIRE_KEYS.duree_vie_h, sources)),
    debit_air_m3_h: toNumberOrNull(pickValue(DESTRAT_KEYS.debit_air_m3_h, sources)),
    niveau_bruit_db: toNumberOrNull(pickValue(DESTRAT_KEYS.niveau_bruit_db, sources)),
    portee_max_m: toNumberOrNull(pickValue(DESTRAT_KEYS.portee_max_m, sources)),
    puissance_moteur_w: toNumberOrNull(pickValue(DESTRAT_KEYS.puissance_moteur_w, sources)),
    // Nouveaux champs : priorité aux colonnes directes, puis JSON (tous en texte)
    materiaux: product.materiaux || parsed?.materiaux || null,
    temperature_couleur: product.temperature_couleur || parsed?.temperature_couleur || null,
    indice_rendu_couleurs: product.indice_rendu_couleurs || parsed?.indice_rendu_couleurs || null,
    commande_controle: product.commande_controle || parsed?.commande_controle || null,
    tension_entree: product.tension_entree || parsed?.tension_entree || null,
    angle_faisceau: product.angle_faisceau || parsed?.angle_faisceau || null,
    protection: product.protection || parsed?.protection || null,
    installation: product.installation || parsed?.installation || null,
    dimensions: product.dimensions || parsed?.dimensions || null,
    poids_net: product.poids_net || parsed?.poids_net || null,
  };

  let type =
    getCategoryType(product.categorie) ||
    getCategoryType(parsed?.type_spec) ||
    (Object.values(LUMINAIRE_KEYS).some((keys) => toNumberOrNull(pickValue(keys, sources)) !== null) ? 'luminaire' : null) ||
    (Object.values(DESTRAT_KEYS).some((keys) => toNumberOrNull(pickValue(keys, sources)) !== null) ? 'destratificateur' : null) ||
    'autre';

  return {
    type,
    raw: parsed ?? product.caracteristiques ?? null,
    specs,
  };
}

export function getSpecSummary(product = {}) {
  const { type, specs, raw } = normalizeCaracteristiques(product);
  const segments = [];

  if (type === 'luminaire') {
    if (specs.puissance_w !== null && specs.puissance_w !== undefined) {
      segments.push(`${formatNumber(specs.puissance_w)} W`);
    }
    if (specs.flux_lumineux_lm !== null && specs.flux_lumineux_lm !== undefined) {
      segments.push(`${formatNumber(specs.flux_lumineux_lm)} lm`);
    }
    if (specs.efficacite_lm_w !== null && specs.efficacite_lm_w !== undefined) {
      segments.push(`${formatNumber(specs.efficacite_lm_w, { maximumFractionDigits: 1 })} lm/W`);
    }
    if (specs.duree_vie_h !== null && specs.duree_vie_h !== undefined) {
      segments.push(`${formatNumber(specs.duree_vie_h)} h`);
    }
    return segments.length ? segments.join(' — ') : null;
  }

  if (type === 'destratificateur') {
    if (specs.debit_air_m3_h !== null && specs.debit_air_m3_h !== undefined) {
      segments.push(`${formatNumber(specs.debit_air_m3_h)} m³/h`);
    }
    if (specs.niveau_bruit_db !== null && specs.niveau_bruit_db !== undefined) {
      segments.push(`${formatNumber(specs.niveau_bruit_db)} dB`);
    }
    if (specs.portee_max_m !== null && specs.portee_max_m !== undefined) {
      segments.push(`Portée ${formatNumber(specs.portee_max_m)} m`);
    }
    return segments.length ? segments.join(' — ') : null;
  }

  if (raw && typeof raw === 'object') {
    const entries = Object.entries(raw)
      .filter(([key]) => key !== 'type_spec')
      .slice(0, 3)
      .map(([key, value]) => `${formatLabelFromKey(key)}: ${value}`);
    return entries.length ? entries.join(' • ') : null;
  }

  return null;
}

export function formatProductSpecsForDisplay(categorie, caracteristiques) {
  const normalized = normalizeCaracteristiques({ categorie, caracteristiques });
  const rows = [];

  if (normalized.type === 'luminaire') {
    if (normalized.specs.flux_lumineux_lm !== null && normalized.specs.flux_lumineux_lm !== undefined) {
      rows.push({ label: 'Flux lumineux (lm)', value: `${formatNumber(normalized.specs.flux_lumineux_lm)} lm` });
    }
    if (normalized.specs.puissance_w !== null && normalized.specs.puissance_w !== undefined) {
      rows.push({ label: 'Puissance (W)', value: `${formatNumber(normalized.specs.puissance_w)} W` });
    }
    if (normalized.specs.efficacite_lm_w !== null && normalized.specs.efficacite_lm_w !== undefined) {
      rows.push({
        label: 'Efficacité lumineuse (lm/W)',
        value: `${formatNumber(normalized.specs.efficacite_lm_w, { maximumFractionDigits: 1 })} lm/W`,
      });
    }
    if (normalized.specs.duree_vie_h !== null && normalized.specs.duree_vie_h !== undefined) {
      rows.push({ label: 'Durée de vie (L80 B10) (h)', value: `${formatNumber(normalized.specs.duree_vie_h)} h` });
    }
    // Nouveaux champs (tous en texte pour accepter lettres et chiffres)
    if (normalized.specs.materiaux) {
      rows.push({ label: 'Matériaux', value: String(normalized.specs.materiaux) });
    }
    if (normalized.specs.temperature_couleur) {
      rows.push({ label: 'Température de couleur', value: String(normalized.specs.temperature_couleur) });
    }
    if (normalized.specs.indice_rendu_couleurs) {
      rows.push({ label: 'Indice de rendu des couleurs', value: String(normalized.specs.indice_rendu_couleurs) });
    }
    if (normalized.specs.commande_controle) {
      rows.push({ label: 'Commande / Contrôle', value: String(normalized.specs.commande_controle) });
    }
    if (normalized.specs.tension_entree) {
      rows.push({ label: 'Tension d\'entrée', value: String(normalized.specs.tension_entree) });
    }
    if (normalized.specs.angle_faisceau) {
      rows.push({ label: 'Angle de faisceau', value: String(normalized.specs.angle_faisceau) });
    }
    if (normalized.specs.protection) {
      rows.push({ label: 'Protection', value: String(normalized.specs.protection) });
    }
    if (normalized.specs.installation) {
      rows.push({ label: 'Installation', value: String(normalized.specs.installation) });
    }
    if (normalized.specs.dimensions) {
      rows.push({ label: 'Dimensions', value: String(normalized.specs.dimensions) });
    }
    if (normalized.specs.poids_net) {
      rows.push({ label: 'Poids net', value: String(normalized.specs.poids_net) });
    }
    if (rows.length) return rows;
  } else if (normalized.type === 'destratificateur') {
    if (normalized.specs.debit_air_m3_h !== null && normalized.specs.debit_air_m3_h !== undefined) {
      rows.push({ label: "Débit d’air (m³/h)", value: `${formatNumber(normalized.specs.debit_air_m3_h)} m³/h` });
    }
    if (normalized.specs.niveau_bruit_db !== null && normalized.specs.niveau_bruit_db !== undefined) {
      rows.push({ label: 'Niveau sonore (dB)', value: `${formatNumber(normalized.specs.niveau_bruit_db)} dB` });
    }
    if (normalized.specs.portee_max_m !== null && normalized.specs.portee_max_m !== undefined) {
      rows.push({ label: 'Portée maximale (m)', value: `${formatNumber(normalized.specs.portee_max_m)} m` });
    }
    if (normalized.specs.puissance_moteur_w !== null && normalized.specs.puissance_moteur_w !== undefined) {
      rows.push({ label: 'Puissance moteur AC (W)', value: `${formatNumber(normalized.specs.puissance_moteur_w)} W` });
    }
    if (rows.length) return rows;
  }

  if (normalized.raw && typeof normalized.raw === 'object') {
    return Object.entries(normalized.raw)
      .filter(([key]) => key !== 'type_spec')
      .map(([key, value]) => ({
        label: formatLabelFromKey(key),
        value: String(value),
      }));
  }

  return [];
}

export function getDisplaySpecsForProduct(product = {}) {
  const normalization = normalizeCaracteristiques(product);
  const schema = getCategorySpecSchema(product?.categorie);
  const specValues = normalization?.specs || {};
  const raw = normalization?.raw && typeof normalization.raw === 'object' ? normalization.raw : {};

  if (!schema?.fields?.length) {
    const allSpecs = Object.entries(raw || {})
      .filter(([key, value]) => key !== 'type_spec' && value !== undefined && value !== null && value !== '')
      .map(([key, value]) => ({
        key,
        label: formatLabelFromKey(key),
        unit: '',
        hero: false,
        order: 999,
        value,
      }));

    return {
      schema: null,
      heroSpecs: [],
      allSpecs,
    };
  }

  const allSpecs = schema.fields
    .map((field, index) => {
      const value = specValues[field.key] ?? raw[field.key];
      if (value === undefined || value === null || value === '') return null;
      return {
        key: field.key,
        label: field.label,
        unit: field.unit || '',
        hero: !!field.hero,
        order: field.order ?? index,
        value,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  const heroSpecs = allSpecs.filter((spec) => spec.hero).slice(0, 3);

  return {
    schema,
    heroSpecs,
    allSpecs,
  };
}
