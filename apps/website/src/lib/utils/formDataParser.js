/**
 * Utilitaires pour parser et extraire les données de formulaire_data JSONB
 */

/**
 * Parse formulaire_data depuis un lead
 * @param {Object} lead - Lead object avec formulaire_data ou products
 * @returns {Object|null} Parsed form data or null
 */
export function parseFormData(lead) {
  if (!lead) return null;

  // Essayer formulaire_data d'abord
  if (lead.formulaire_data) {
    try {
      if (typeof lead.formulaire_data === 'string') {
        return JSON.parse(lead.formulaire_data);
      }
      return lead.formulaire_data;
    } catch (e) {
      console.error('Error parsing formulaire_data:', e);
    }
  }

  // Sinon essayer products (ancien format)
  if (lead.products) {
    try {
      if (typeof lead.products === 'string') {
        const parsed = JSON.parse(lead.products);
        // Extraire les données du formulaire depuis products
        return {
          step1: parsed.step1,
          step2: parsed.step2,
          step3: parsed.step3,
          step4: parsed.step4,
          buildings: parsed.buildings,
          step6: parsed.step6,
          ceePotential: parsed.ceePotential
        };
      }
      return lead.products;
    } catch (e) {
      console.error('Error parsing products:', e);
    }
  }

  return null;
}

/**
 * Extract buildings data from lead
 * @param {Object} lead - Lead object
 * @returns {Array} Array of buildings
 */
export function extractBuildings(lead) {
  const formData = parseFormData(lead);
  if (formData && formData.buildings && Array.isArray(formData.buildings)) {
    return formData.buildings;
  }
  
  // Fallback: créer un bâtiment depuis les colonnes principales
  if (lead.type_batiment || lead.surface_m2) {
    return [{
      type: lead.type_batiment || 'warehouse',
      surface: lead.surface_m2 || '',
      ceilingHeight: lead.hauteur_plafond || '',
      heating: false,
      heatingMode: lead.mode_chauffage || '',
      heatingPower: lead.puissance_electrique || '',
      interiorLighting: {}
    }];
  }
  
  return [];
}

/**
 * Get current step from lead
 * @param {Object} lead - Lead object
 * @returns {number} Step number (0-6)
 */
export function getCurrentStep(lead) {
  if (lead.formulaire_complet) return 6;
  if (!lead.etape_formulaire) {
    if (lead.nom || lead.email || lead.telephone) return 0; // Mini-form
    return 0;
  }
  if (lead.etape_formulaire.includes('step')) {
    const stepNum = parseInt(lead.etape_formulaire.replace('step', ''));
    return isNaN(stepNum) ? 0 : stepNum;
  }
  if (lead.etape_formulaire === 'mini_form_completed') return 0;
  if (lead.etape_formulaire === 'complet') return 6;
  return 0;
}

/**
 * Check if a step is completed
 * @param {Object} lead - Lead object
 * @param {number} stepNum - Step number (0-6)
 * @returns {boolean}
 */
export function isStepCompleted(lead, stepNum) {
  const formData = parseFormData(lead);
  
  if (stepNum === 0) {
    return !!(lead.nom || lead.email || lead.telephone);
  }
  
  if (!formData) return false;
  
  switch (stepNum) {
    case 1:
      return !!(formData.step1?.companyName || lead.societe);
    case 2:
      return !!(formData.step2?.firstName || formData.step2?.email || lead.email);
    case 3:
      return !!formData.step3?.energyExpenses || !!lead.consommation_annuelle;
    case 4:
      return !!formData.step4?.buildingCount || (formData.buildings && formData.buildings.length > 0);
    case 5:
      return !!(formData.buildings && formData.buildings.length > 0 && formData.buildings[0]?.type);
    case 6:
      return !!formData.step6?.remarks || !!lead.message;
    default:
      return false;
  }
}

/**
 * Get missing fields for a step
 * @param {Object} lead - Lead object
 * @param {number} stepNum - Step number
 * @returns {Array} Array of missing field names
 */
export function getMissingFields(lead, stepNum) {
  const missing = [];
  const formData = parseFormData(lead);
  
  switch (stepNum) {
    case 0: // Mini-form
      if (!lead.nom) missing.push('nom');
      if (!lead.email) missing.push('email');
      if (!lead.telephone) missing.push('telephone');
      break;
    case 1: // Company info
      // Entreprise
      if (!formData?.step1?.companyName && !lead.societe) missing.push('societe');
      if (!formData?.step1?.siret && !lead.siret) missing.push('siret');
      // SIREN: only missing if not in lead.siren AND cannot be derived from SIRET
      const hasSirenDirect = lead.siren || (formData?.step1?.siren);
      const canDeriveSiren = lead.siret && lead.siret.replace(/\s/g, '').length >= 9;
      if (!hasSirenDirect && !canDeriveSiren) missing.push('siren');
      if (!formData?.step1?.website && !lead.site_web) missing.push('site_web');
      // Adresse du siège
      if (!formData?.step1?.address && !lead.adresse_siege && !lead.adresse) missing.push('adresse_siege');
      if (!formData?.step1?.postalCode && !lead.code_postal_siege && !lead.code_postal) missing.push('code_postal_siege');
      if (!formData?.step1?.city && !lead.ville_siege && !lead.ville) missing.push('ville_siege');
      break;
    case 2: // Contact
      if (!formData?.step2?.firstName && !lead.prenom) missing.push('prenom');
      if (!formData?.step2?.lastName && !lead.nom) missing.push('nom');
      if (!formData?.step2?.email && !lead.email) missing.push('email');
      if (!formData?.step2?.phone && !lead.telephone) missing.push('telephone');
      break;
    // Add more cases as needed
  }
  
  return missing;
}

