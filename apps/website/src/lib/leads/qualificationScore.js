/**
 * Advanced Lead Qualification Score Calculator
 * 
 * Calculates a comprehensive qualification score (0-100) based on 4 pillars:
 * - Pillar A: Data Quality & Contactability (0-25)
 * - Pillar B: Project & CEE Potential (0-40) - Includes buildings bonus
 * - Pillar C: Engagement & Timing (0-55) - Status progression is CRITICAL (0-30 points)
 * - Pillar D: Strategic Fit & Risks (0-10)
 * 
 * @module qualificationScore
 */

/**
 * @typedef {'non_qualifie' | 'a_explorer' | 'qualifie' | 'tres_qualifie'} QualificationLevel
 */

/**
 * @typedef {Object} QualificationBreakdown
 * @property {number} total - Total score (0-100)
 * @property {QualificationLevel} level - Qualification level
 * @property {Object} pillars - Score breakdown by pillar
 * @property {number} pillars.data_quality - Pillar A score (0-25)
 * @property {number} pillars.project_potential - Pillar B score (0-35)
 * @property {number} pillars.engagement - Pillar C score (0-30)
 * @property {number} pillars.strategic_fit - Pillar D score (0-10)
 * @property {string[]} reasons - List of readable reasons for the score
 */

/**
 * Configuration constants
 */
const CONFIG = {
  // Pillar A weights
  A1_IDENTITY_MAX: 10,
  A1_PHONE_POINTS: 4,
  A1_EMAIL_POINTS: 4,
  A1_NAME_POINTS: 2,
  
  A2_COMPANY_MAX: 10,
  A2_SOCIETE_POINTS: 2,
  A2_SIRET_POINTS: 4,
  A2_SIREN_POINTS: 2,
  A2_RAISON_TRAVAUX_POINTS: 2,
  
  A3_ADDRESS_MAX: 5,
  A3_SIEGE_POINTS: 2,
  A3_TRAVAUX_POINTS: 3,
  
  // Pillar B weights - Augmenté pour bâtiments et configuration
  B1_PROJECT_MAX: 15, // Augmenté
  B1_TYPE_PROJET_POINTS: 5,
  B1_TYPE_BATIMENT_POINTS: 5,
  B1_SURFACE_POINTS: 5,
  
  B2_CONFIG_MAX: 15, // Augmenté - Configuration détaillée importante
  B2_CHAUFFAGE_POINTS: 2,
  B2_ZONE_CLIMATIQUE_POINTS: 2,
  B2_REGION_POINTS: 2,
  B2_TECH_INFO_POINTS: 4,
  
  B3_CEE_MAX: 10,
  B3_CEE_0_10K_POINTS: 3,
  B3_CEE_10K_50K_POINTS: 6,
  B3_CEE_50K_PLUS_POINTS: 8,
  B3_OPERATION_CEE_POINTS: 2,
  
  B4_COMPLEXITY_MAX: 10, // Augmenté
  B4_MULTI_BUILDINGS_POINTS: 3,
  B4_MULTI_OPERATIONS_POINTS: 2,
  
  // Pillar C weights
  C1_ACTIVITY_MAX: 8, // Réduit - Moins important que la progression
  C1_NOTE_POINTS: 1,
  C1_CALL_POINTS: 2,
  C1_EMAIL_POINTS: 2,
  C1_RDV_POINTS: 2,
  
  C2_FRESHNESS_MAX: 5, // Inchangé
  C2_FRESH_7D_POINTS: 5,
  C2_FRESH_30D_POINTS: 3,
  C2_FRESH_90D_POINTS: 1,
  
  C3_STATUS_MAX: 30, // AUGMENTÉ - La progression dans le pipeline est CRUCIALE pour un bon score
  
  C4_FORM_MAX: 10, // Augmenté - Formulaire complété = important
  
  // Buildings bonus (nouveau)
  BUILDINGS_BONUS_POINTS: 15, // Bonus majeur si bâtiments remplis
  
  // Priority bonus (réduit car moins important que la progression)
  PRIORITY_HAUTE_POINTS: 5,
  PRIORITY_NORMALE_POINTS: 2,
  PRIORITY_BASSE_POINTS: 0,
  C4_FORM_COMPLETE_POINTS: 3, // Will be doubled if formulaire_complet
  C4_FORM_STEP_POINTS: 2,
  
  // Pillar D weights
  D1_FIT_MAX: 10,
  D1_TARGET_BUILDING_POINTS: 4,
  D1_SURFACE_500_POINTS: 3,
  D1_PRIORITY_REGION_POINTS: 3,
  
  D2_RISK_MIN: -5,
  D2_RISK_MAX: 5,
  
  // Thresholds
  MIN_SURFACE_TARGET: 500,
  MIN_CEE_10K: 10000,
  MIN_CEE_50K: 50000,
  
  // Freshness thresholds (days)
  FRESH_7D: 7,
  FRESH_30D: 30,
  FRESH_90D: 90,
  
  // Target building types
  TARGET_BUILDING_TYPES: [
    'entrepôt', 'logistique', 'warehouse', 'factory', 'usine',
    'serre', 'magasin', 'retail', 'bureau', 'offices'
  ],
  
  // Priority regions
  PRIORITY_REGIONS: [
    'Île-de-France', 'Hauts-de-France', 'Grand Est',
    'Auvergne-Rhône-Alpes', 'Pays de la Loire'
  ],
  
  // Disposable email domains (basic list)
  DISPOSABLE_EMAIL_DOMAINS: [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'trashmail.com', 'throwaway.email'
  ]
};

/**
 * Status code mapping to engagement points
 */
const STATUS_POINTS = {
  'NOUVEAU': 0,
  'QUALIFICATION': 2,
  'DONNEES_RECUES': 3,
  'ETUDE': 4,
  'DEVIS_ENVOYE': 4,
  'DEVIS_SIGNE': 5,
  'HORS_CIBLE': 0,
  'CLOTURE': 0
};

/**
 * Validates phone number format (French)
 * @param {string} phone 
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+33|0)[1-9](\d{2}){4}$/.test(cleaned);
}

/**
 * Validates email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Checks if email is disposable
 * @param {string} email 
 * @returns {boolean}
 */
function isDisposableEmail(email) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return CONFIG.DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Validates SIRET (14 digits)
 * @param {string} siret 
 * @returns {boolean}
 */
function isValidSIRET(siret) {
  if (!siret) return false;
  const cleaned = siret.replace(/\s/g, '');
  return /^\d{14}$/.test(cleaned);
}

/**
 * Validates SIREN (9 digits)
 * @param {string} siren 
 * @returns {boolean}
 */
function isValidSIREN(siren) {
  if (!siren) return false;
  const cleaned = siren.replace(/\s/g, '');
  return /^\d{9}$/.test(cleaned);
}

/**
 * Gets days between two dates
 * @param {Date|string} date1 
 * @param {Date|string} date2 
 * @returns {number}
 */
function daysBetween(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets status code from lead (prioritizes status.code, then status_id lookup, then statut text)
 * @param {Object} lead 
 * @param {Array} leadStatuses 
 * @returns {string|null}
 */
function getStatusCode(lead, leadStatuses = []) {
  if (lead.status?.code) {
    return lead.status.code;
  }
  
  if (lead.status_id && leadStatuses.length > 0) {
    const status = leadStatuses.find(s => s.id === lead.status_id);
    if (status?.code) return status.code;
  }
  
  if (lead.statut) {
    // Normalize statut text to code format
    return lead.statut.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '_');
  }
  
  return null;
}

/**
 * Pillar A: Data Quality & Contactability (0-25)
 * @param {Object} lead 
 * @param {string[]} reasons 
 * @returns {number}
 */
function calculatePillarA(lead, reasons) {
  let score = 0;
  
  // A1. Identity & Contact (0-10)
  let a1Score = 0;
  
  if (isValidPhone(lead.telephone)) {
    a1Score += CONFIG.A1_PHONE_POINTS;
    reasons.push('Téléphone valide');
  } else {
    reasons.push('Téléphone manquant ou invalide');
  }
  
  if (isValidEmail(lead.email)) {
    a1Score += CONFIG.A1_EMAIL_POINTS;
    reasons.push('Email valide');
  } else {
    reasons.push('Email manquant ou invalide');
  }
  
  const hasName = !!(lead.civilite && lead.prenom && lead.nom);
  const hasPartialName = !!(lead.prenom || lead.nom);
  
  if (hasName) {
    a1Score += CONFIG.A1_NAME_POINTS;
    reasons.push('Civilité, prénom et nom renseignés');
  } else if (hasPartialName) {
    a1Score += 1;
    reasons.push('Informations de contact partielles');
  } else {
    reasons.push('Civilité, prénom ou nom manquants');
  }
  
  score += Math.min(a1Score, CONFIG.A1_IDENTITY_MAX);
  
  // A2. Company & Legal (0-10)
  let a2Score = 0;
  
  if (lead.societe) {
    a2Score += CONFIG.A2_SOCIETE_POINTS;
  } else {
    reasons.push('Raison sociale manquante');
  }
  
  if (isValidSIRET(lead.siret)) {
    a2Score += CONFIG.A2_SIRET_POINTS;
    reasons.push('SIRET valide');
  } else {
    reasons.push('SIRET non renseigné ou invalide');
  }
  
  if (isValidSIREN(lead.siren || (lead.siret ? lead.siret.slice(0, 9) : ''))) {
    a2Score += CONFIG.A2_SIREN_POINTS;
  }
  
  if (lead.raison_sociale_travaux) {
    a2Score += CONFIG.A2_RAISON_TRAVAUX_POINTS;
    reasons.push('Raison sociale travaux renseignée');
  }
  
  score += Math.min(a2Score, CONFIG.A2_COMPANY_MAX);
  
  // A3. Structured Addresses (0-5)
  let a3Score = 0;
  
  const hasSiege = !!(lead.adresse_siege && lead.code_postal_siege && lead.ville_siege);
  const hasTravaux = !!(lead.adresse_travaux && lead.code_postal_travaux && lead.ville_travaux);
  
  if (hasSiege) {
    a3Score += CONFIG.A3_SIEGE_POINTS;
    reasons.push('Adresse du siège complète');
  } else {
    reasons.push('Adresse du siège incomplète');
  }
  
  if (hasTravaux) {
    a3Score += CONFIG.A3_TRAVAUX_POINTS;
    reasons.push('Adresse des travaux complète');
  } else {
    reasons.push('Adresse des travaux incomplète');
  }
  
  score += Math.min(a3Score, CONFIG.A3_ADDRESS_MAX);
  
  return Math.min(score, 25);
}

/**
 * Pillar B: Project & CEE Potential (0-35)
 * @param {Object} lead 
 * @param {Array} operationsCee 
 * @param {string[]} reasons 
 * @returns {number}
 */
function calculatePillarB(lead, operationsCee = [], reasons) {
  let score = 0;
  
  // B1. Project Definition (0-10)
  let b1Score = 0;
  
  if (lead.type_projet) {
    b1Score += CONFIG.B1_TYPE_PROJET_POINTS;
    reasons.push(`Type de projet: ${lead.type_projet}`);
  } else {
    reasons.push('Type de projet non renseigné');
  }
  
  if (lead.type_batiment) {
    b1Score += CONFIG.B1_TYPE_BATIMENT_POINTS;
  }
  
  const surface = parseFloat(lead.surface || lead.surface_m2 || 0);
  if (surface > 0) {
    b1Score += CONFIG.B1_SURFACE_POINTS;
    reasons.push(`Surface: ${surface} m²`);
  } else {
    reasons.push('Surface non renseignée');
  }
  
  score += Math.min(b1Score, CONFIG.B1_PROJECT_MAX);
  
  // B2. Building Configuration (0-10)
  let b2Score = 0;
  
  if (lead.mode_chauffage) {
    b2Score += CONFIG.B2_CHAUFFAGE_POINTS;
  }
  
  if (lead.zone_climatique) {
    b2Score += CONFIG.B2_ZONE_CLIMATIQUE_POINTS;
    reasons.push(`Zone climatique: ${lead.zone_climatique}`);
  }
  
  if (lead.region) {
    b2Score += CONFIG.B2_REGION_POINTS;
  }
  
  // Check for technical info in formulaire_data
  let hasTechInfo = false;
  try {
    const formData = typeof lead.formulaire_data === 'string' 
      ? JSON.parse(lead.formulaire_data) 
      : lead.formulaire_data;
    
    if (formData && formData.buildings && Array.isArray(formData.buildings) && formData.buildings.length > 0) {
      hasTechInfo = true;
      // Check for technical details in buildings
      const hasTechDetails = formData.buildings.some(b => 
        b.ceilingHeight || b.heatingMode || b.heatingPower || 
        b.interiorLighting || b.exteriorLighting
      );
      if (hasTechDetails) {
        hasTechInfo = true;
      }
    }
    
    // Also check for technical fields directly in formData
    if (formData.hauteur_plafond || formData.puissance_electrique || 
        formData.nombre_points_lumineux || formData.consommation_annuelle) {
      hasTechInfo = true;
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  // Also check direct columns
  if (lead.hauteur_plafond || lead.puissance_electrique || 
      lead.nombre_points_lumineux || lead.consommation_annuelle) {
    hasTechInfo = true;
  }
  
  if (hasTechInfo) {
    b2Score += CONFIG.B2_TECH_INFO_POINTS;
    reasons.push('Informations techniques détaillées');
  }
  
  score += Math.min(b2Score, CONFIG.B2_CONFIG_MAX);
  
  // B3. CEE Potential (0-10)
  let b3Score = 0;
  
  const ceeAmount = parseFloat(lead.montant_cee_estime || 0);
  
  if (ceeAmount >= CONFIG.MIN_CEE_50K) {
    b3Score += CONFIG.B3_CEE_50K_PLUS_POINTS;
    reasons.push(`Montant CEE estimé > ${CONFIG.MIN_CEE_50K.toLocaleString('fr-FR')} €`);
  } else if (ceeAmount >= CONFIG.MIN_CEE_10K) {
    b3Score += CONFIG.B3_CEE_10K_50K_POINTS;
    reasons.push(`Montant CEE estimé entre ${CONFIG.MIN_CEE_10K.toLocaleString('fr-FR')} et ${CONFIG.MIN_CEE_50K.toLocaleString('fr-FR')} €`);
  } else if (ceeAmount > 0) {
    b3Score += CONFIG.B3_CEE_0_10K_POINTS;
    reasons.push(`Montant CEE estimé: ${ceeAmount.toLocaleString('fr-FR')} €`);
  } else {
    reasons.push('Montant CEE estimé non renseigné');
  }
  
  // Check for CEE operations
  if (operationsCee && operationsCee.length > 0) {
    const validOperations = operationsCee.filter(op => op.fiche_cee_id);
    if (validOperations.length > 0) {
      b3Score += CONFIG.B3_OPERATION_CEE_POINTS;
      reasons.push(`${validOperations.length} opération(s) CEE liée(s)`);
    }
  }
  
  score += Math.min(b3Score, CONFIG.B3_CEE_MAX);
  
  // B4. Complexity / Multi-sites (0-10) - Augmenté pour bâtiments
  let b4Score = 0;
  
  // Count buildings and check if they are filled
  let buildingCount = 0;
  let hasDetailedBuildings = false;
  try {
    const formData = typeof lead.formulaire_data === 'string' 
      ? JSON.parse(lead.formulaire_data) 
      : lead.formulaire_data;
    
    if (formData && formData.buildings && Array.isArray(formData.buildings)) {
      buildingCount = formData.buildings.length;
      
      // Check if buildings have detailed information
      hasDetailedBuildings = formData.buildings.some(b => 
        b.type && b.surface && (b.ceilingHeight || b.heatingMode || b.interiorLighting || b.exteriorLighting)
      );
    }
  } catch (e) {
    // Ignore
  }
  
  // Bonus MAJEUR si au moins un bâtiment est rempli avec détails
  if (hasDetailedBuildings) {
    b4Score += CONFIG.BUILDINGS_BONUS_POINTS; // 15 points
    reasons.push(`Bâtiment(s) détaillé(s) renseigné(s) (+${CONFIG.BUILDINGS_BONUS_POINTS} points)`);
  } else if (buildingCount > 0) {
    b4Score += CONFIG.B4_MULTI_BUILDINGS_POINTS; // 3 points pour bâtiments basiques
    reasons.push(`${buildingCount} bâtiment(s) renseigné(s) (+${CONFIG.B4_MULTI_BUILDINGS_POINTS} points)`);
  } else {
    reasons.push('Aucun bâtiment détaillé renseigné');
  }
  
  // Count operations
  if (operationsCee && operationsCee.length > 1) {
    b4Score += CONFIG.B4_MULTI_OPERATIONS_POINTS;
    reasons.push(`${operationsCee.length} opération(s) CEE`);
  }
  
  score += Math.min(b4Score, CONFIG.B4_COMPLEXITY_MAX + CONFIG.BUILDINGS_BONUS_POINTS);
  
  return Math.min(score, 40); // Augmenté de 35 à 40 pour accommoder le bonus bâtiments
}

/**
 * Pillar C: Engagement & Timing (0-55) - Augmenté pour inclure statut, priorité, formulaire et bâtiments
 * @param {Object} lead 
 * @param {Array} activities 
 * @param {Array} notes 
 * @param {Array} leadStatuses 
 * @param {string[]} reasons 
 * @returns {number}
 */
function calculatePillarC(lead, activities = [], notes = [], leadStatuses = [], reasons) {
  let score = 0;
  
  // C1. Activity & Interactions (0-10)
  let c1Score = 0;
  
  const noteCount = notes ? notes.length : 0;
  if (noteCount > 0) {
    c1Score += CONFIG.C1_NOTE_POINTS;
    reasons.push(`${noteCount} note(s) interne(s)`);
  }
  
  // Count calls, emails, RDV from activities
  const calls = activities.filter(a => a.event_type === 'call' || a.event_type?.includes('appel')).length;
  const emails = activities.filter(a => a.event_type === 'email' || a.event_type?.includes('email')).length;
  const rdvs = activities.filter(a => a.event_type === 'rdv' || a.event_type === 'meeting' || a.event_type?.includes('rendez-vous')).length;
  
  if (calls > 0) {
    c1Score += CONFIG.C1_CALL_POINTS;
    reasons.push(`${calls} appel(s) effectué(s)`);
  }
  
  if (emails > 0) {
    c1Score += CONFIG.C1_EMAIL_POINTS;
    reasons.push(`${emails} email(s) envoyé(s)`);
  }
  
  if (rdvs > 0) {
    c1Score += CONFIG.C1_RDV_POINTS;
    reasons.push(`${rdvs} rendez-vous planifié(s)`);
  }
  
  score += Math.min(c1Score, CONFIG.C1_ACTIVITY_MAX);
  
  // C2. Freshness (0-5)
  let c2Score = 0;
  
  // Get last activity date from activities, notes, or lead update
  let lastActivityDate = null;
  
  // From activities
  if (activities.length > 0) {
    const activityDates = activities.map(a => new Date(a.created_at || a.date));
    lastActivityDate = new Date(Math.max(...activityDates));
  }
  
  // From notes
  if (notes.length > 0) {
    const noteDates = notes.map(n => new Date(n.created_at));
    const latestNote = new Date(Math.max(...noteDates));
    if (!lastActivityDate || latestNote > lastActivityDate) {
      lastActivityDate = latestNote;
    }
  }
  
  // From lead update
  if (lead.updated_at) {
    const leadUpdate = new Date(lead.updated_at);
    if (!lastActivityDate || leadUpdate > lastActivityDate) {
      lastActivityDate = leadUpdate;
    }
  }
  
  if (lastActivityDate) {
    const daysSince = daysBetween(lastActivityDate, new Date());
    
    if (daysSince < CONFIG.FRESH_7D) {
      c2Score += CONFIG.C2_FRESH_7D_POINTS;
      reasons.push(`Activité récente (il y a ${daysSince} jour(s))`);
    } else if (daysSince < CONFIG.FRESH_30D) {
      c2Score += CONFIG.C2_FRESH_30D_POINTS;
      reasons.push(`Dernière activité il y a ${daysSince} jour(s)`);
    } else if (daysSince < CONFIG.FRESH_90D) {
      c2Score += CONFIG.C2_FRESH_90D_POINTS;
      reasons.push(`Dernière activité il y a ${daysSince} jour(s)`);
    } else {
      reasons.push(`Aucune activité depuis plus de ${daysSince} jour(s)`);
    }
  } else {
    reasons.push('Aucune activité enregistrée');
  }
  
  score += Math.min(c2Score, CONFIG.C2_FRESHNESS_MAX);
  
  // C3. Status Progress (0-30) - CRITIQUE : La progression dans le pipeline est le facteur le plus important
  const statusCode = getStatusCode(lead, leadStatuses);
  let statusScore = 0;
  
  // Try to get pipeline_order from status object or leadStatuses array
  let pipelineOrder = null;
  
  if (lead.status?.pipeline_order !== undefined) {
    pipelineOrder = lead.status.pipeline_order;
  } else if (lead.status_id && leadStatuses.length > 0) {
    const statusObj = leadStatuses.find(s => s.id === lead.status_id);
    if (statusObj?.pipeline_order !== undefined) {
      pipelineOrder = statusObj.pipeline_order;
    }
  }
  
  // Calculate score based on pipeline_order (higher order = more advanced = MUCH more points)
  if (pipelineOrder !== null && pipelineOrder > 0) {
    // Progressive scoring: pipeline_order 1-8 → 0-30 points
    // NOUVEAU (1) = 0 points
    // Qualification/Données reçues (2-3) = 5-10 points
    // Étude/Devis envoyé (4-5) = 15-20 points
    // Devis signé/Clôturé (6-8) = 25-30 points
    
    if (lead.status?.is_won || statusCode === 'DEVIS_SIGNE' || statusCode === 'CLOTURE') {
      statusScore = CONFIG.C3_STATUS_MAX; // 30 points maximum for won deals
      reasons.push('Statut gagné: Lead clôturé ou devis signé (+30 points)');
    } else if (statusCode === 'HORS_CIBLE') {
      statusScore = 0; // No points for out-of-scope
      reasons.push('Statut: Hors cible (0 point)');
    } else {
      // Progressive scoring based on pipeline order
      // Formula: (pipeline_order - 1) / 7 * 30
      // Order 1 (NOUVEAU) = 0 points
      // Order 8 (max) = 30 points
      const maxOrder = 8; // Assuming max pipeline_order is 8
      if (pipelineOrder === 1) {
        statusScore = 0; // NOUVEAU = 0 points
        reasons.push('Statut: Nouveau - Aucune progression (0 point)');
      } else if (pipelineOrder <= 3) {
        // Qualification, Données reçues
        statusScore = Math.round(((pipelineOrder - 1) / 7) * CONFIG.C3_STATUS_MAX);
        const statusLabel = lead.status?.label || lead.statut || statusCode;
        reasons.push(`Statut début de pipeline: ${statusLabel} (+${statusScore} points)`);
      } else if (pipelineOrder <= 5) {
        // Étude, Devis envoyé
        statusScore = Math.round(((pipelineOrder - 1) / 7) * CONFIG.C3_STATUS_MAX);
        const statusLabel = lead.status?.label || lead.statut || statusCode;
        reasons.push(`Statut avancé: ${statusLabel} (+${statusScore} points)`);
      } else {
        // Devis signé, etc.
        statusScore = Math.round(((pipelineOrder - 1) / 7) * CONFIG.C3_STATUS_MAX);
        const statusLabel = lead.status?.label || lead.statut || statusCode;
        reasons.push(`Statut très avancé: ${statusLabel} (+${statusScore} points)`);
      }
    }
  } else if (statusCode && STATUS_POINTS.hasOwnProperty(statusCode)) {
    // Fallback to old STATUS_POINTS mapping, but scale up significantly
    const baseScore = STATUS_POINTS[statusCode];
    statusScore = baseScore * 6; // Scale up (0-5 → 0-30 points)
    if (statusScore > 0) {
      const statusLabel = lead.status?.label || lead.statut || statusCode;
      reasons.push(`Statut: ${statusLabel} (+${statusScore} points)`);
    }
  }
  
  score += Math.min(statusScore, CONFIG.C3_STATUS_MAX); // Max 30 points for status
  
  // C4. Form & Completion (0-10) - Augmenté pour importance
  let c4Score = 0;
  
  if (lead.formulaire_complet) {
    c4Score += CONFIG.C4_FORM_COMPLETE_POINTS * 2; // 6 points au lieu de 3
    reasons.push('Formulaire complété (+6 points)');
  } else {
    reasons.push('Formulaire non complété');
  }
  
  // Check form step - bonus progressif
  if (lead.etape_formulaire) {
    // Try to extract step number (e.g., "step4", "4", etc.)
    const stepMatch = lead.etape_formulaire.match(/(\d+)/);
    if (stepMatch) {
      const stepNum = parseInt(stepMatch[1], 10);
      if (stepNum >= 5) {
        c4Score += 4; // Bonus pour étapes avancées
        reasons.push(`Étape du formulaire très avancée (étape ${stepNum}) (+4 points)`);
      } else if (stepNum >= 4) {
        c4Score += 2; // Bonus pour étapes moyennes
        reasons.push(`Étape du formulaire avancée (étape ${stepNum}) (+2 points)`);
      }
    }
  }
  
  score += Math.min(c4Score, CONFIG.C4_FORM_MAX);
  
  // C5. Priority Bonus (0-8) - Ajout de la priorité comme facteur de score
  let c5Score = 0;
  const priorite = lead.priorite?.toLowerCase() || '';
  
  if (priorite === 'haute' || priorite === 'high') {
    c5Score += CONFIG.PRIORITY_HAUTE_POINTS;
    reasons.push('Priorité Haute (+8 points)');
  } else if (priorite === 'normale' || priorite === 'normal' || priorite === 'moyenne' || priorite === 'medium') {
    c5Score += CONFIG.PRIORITY_NORMALE_POINTS;
    reasons.push('Priorité Normale (+3 points)');
  } else if (priorite === 'basse' || priorite === 'low') {
    c5Score += CONFIG.PRIORITY_BASSE_POINTS;
    reasons.push('Priorité Basse (0 point)');
  }
  
  score += Math.min(c5Score, CONFIG.PRIORITY_HAUTE_POINTS);
  
  // Pillar C is now 0-55 (8 activity + 5 freshness + 30 status + 10 form + 5 priority)
  // This allows status progression to be the main driver of score
  return Math.min(score, 55);
}

/**
 * Pillar D: Strategic Fit & Risks (0-10) - Réduit pour équilibrer avec Pillar C augmenté
 * @param {Object} lead 
 * @param {Array} leadStatuses 
 * @param {string[]} reasons 
 * @returns {number}
 */
function calculatePillarD(lead, leadStatuses = [], reasons) {
  let score = 0;
  
  // D1. Segment Fit (0-10)
  let d1Score = 0;
  
  // Check building type
  if (lead.type_batiment) {
    const buildingTypeLower = lead.type_batiment.toLowerCase();
    const isTarget = CONFIG.TARGET_BUILDING_TYPES.some(target => 
      buildingTypeLower.includes(target)
    );
    
    if (isTarget) {
      d1Score += CONFIG.D1_TARGET_BUILDING_POINTS;
      reasons.push(`Type de bâtiment cible: ${lead.type_batiment}`);
    }
  }
  
  // Check surface
  const surface = parseFloat(lead.surface || lead.surface_m2 || 0);
  if (surface >= CONFIG.MIN_SURFACE_TARGET) {
    d1Score += CONFIG.D1_SURFACE_500_POINTS;
    reasons.push(`Surface ≥ ${CONFIG.MIN_SURFACE_TARGET} m²`);
  }
  
  // Check region
  if (lead.region && CONFIG.PRIORITY_REGIONS.includes(lead.region)) {
    d1Score += CONFIG.D1_PRIORITY_REGION_POINTS;
    reasons.push(`Région prioritaire: ${lead.region}`);
  }
  
  score += Math.min(d1Score, CONFIG.D1_FIT_MAX);
  
  // D2. Risks & Flags (-5 to +5, then clamp)
  let riskScore = 0;
  
  // Check if lead is closed/lost
  const statusCode = getStatusCode(lead, leadStatuses);
  if (statusCode === 'HORS_CIBLE' || statusCode === 'CLOTURE') {
    riskScore += CONFIG.D2_RISK_MIN;
    reasons.push('Lead hors cible ou clôturé');
  }
  
  // Check disposable email
  if (isDisposableEmail(lead.email)) {
    riskScore -= 2;
    reasons.push('Email jetable détecté');
  }
  
  // Check missing contact info
  if (!isValidPhone(lead.telephone) && !isValidEmail(lead.email)) {
    riskScore -= 3;
    reasons.push('Téléphone et email invalides');
  }
  
  // Check non-target project/building (basic check)
  if (lead.type_batiment) {
    const buildingTypeLower = lead.type_batiment.toLowerCase();
    const isTarget = CONFIG.TARGET_BUILDING_TYPES.some(target => 
      buildingTypeLower.includes(target)
    );
    
    if (!isTarget && !buildingTypeLower.includes('autre')) {
      riskScore -= 3;
      reasons.push('Type de bâtiment non cible');
    }
  }
  
  // Clamp risk score
  riskScore = Math.max(CONFIG.D2_RISK_MIN, Math.min(CONFIG.D2_RISK_MAX, riskScore));
  
  // Apply risk score (it's a penalty, so subtract from base)
  // But since we want it to be 0-15, we add it (if positive) or subtract (if negative)
  score = Math.max(0, score + riskScore);
  
  // Ensure total doesn't exceed 10 (réduit de 15 à 10 pour équilibrer)
  return Math.min(score, 10);
}

/**
 * Determines qualification level from total score
 * @param {number} total 
 * @returns {QualificationLevel}
 */
function getQualificationLevel(total) {
  if (total < 25) return 'non_qualifie';
  if (total < 50) return 'a_explorer';
  if (total < 75) return 'qualifie';
  return 'tres_qualifie';
}

/**
 * Limits reasons array to most relevant ones
 * @param {string[]} reasons 
 * @returns {string[]}
 */
function prioritizeReasons(reasons) {
  // Prioritize positive indicators first, then important negatives
  const positive = reasons.filter(r => 
    r.includes('valide') || r.includes('complète') || 
    r.includes('CEE') || r.includes('opération') ||
    r.includes('récente') || r.includes('Statut') && !r.includes('Nouveau')
  );
  
  const negatives = reasons.filter(r => 
    r.includes('manquant') || r.includes('invalide') || 
    r.includes('incomplet') || r.includes('Aucune')
  );
  
  // Combine: positives first, then negatives, limit to 15 total
  const combined = [...positive, ...negatives];
  return combined.slice(0, 15);
}

/**
 * Computes the qualification score breakdown for a lead
 * 
 * @param {Object} lead - Lead object with all fields
 * @param {Object} relations - Related data
 * @param {Array} relations.activities - Lead activities/events
 * @param {Array} relations.notes - Internal notes
 * @param {Array} relations.operationsCee - CEE operations linked to lead
 * @param {Array} relations.leadStatuses - Available lead statuses
 * @returns {QualificationBreakdown}
 */
export function computeQualificationScore(lead, relations = {}) {
  const {
    activities = [],
    notes = [],
    operationsCee = [],
    leadStatuses = []
  } = relations;
  
  const reasons = [];
  
  // Calculate each pillar
  const pillarA = calculatePillarA(lead, reasons);
  const pillarB = calculatePillarB(lead, operationsCee, reasons);
  const pillarC = calculatePillarC(lead, activities, notes, leadStatuses, reasons);
  const pillarD = calculatePillarD(lead, leadStatuses, reasons);
  
  // Calculate total
  let total = pillarA + pillarB + pillarC + pillarD;
  total = Math.max(0, Math.min(100, total));
  
  // Determine level
  const level = getQualificationLevel(total);
  
  // Prioritize reasons
  const prioritizedReasons = prioritizeReasons(reasons);
  
  return {
    total,
    level,
    pillars: {
      data_quality: pillarA,
      project_potential: pillarB,
      engagement: pillarC,
      strategic_fit: pillarD
    },
    reasons: prioritizedReasons
  };
}

/**
 * Utility function to recalculate score and update lead
 * This can be called from API functions after updates
 * @param {string} leadId 
 * @param {Object} lead 
 * @param {Object} relations 
 * @returns {Promise<{success: boolean, score?: number, breakdown?: QualificationBreakdown, error?: string}>}
 */
export async function recalculateAndSaveScore(leadId, lead, relations = {}) {
  try {
    const breakdown = computeQualificationScore(lead, relations);
    
    // Update lead in database
    const { supabase } = await import('@/lib/supabaseClient');
    const { error } = await supabase
      .from('leads')
      .update({ qualification_score: breakdown.total })
      .eq('id', leadId);
    
    if (error) throw error;
    
    return {
      success: true,
      score: breakdown.total,
      breakdown
    };
  } catch (error) {
    console.error('Error recalculating qualification score:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

