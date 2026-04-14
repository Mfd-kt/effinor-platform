import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import {
  isMiniFormSupabaseInsertEnabled,
  insertMiniFormLeadFromSanitized,
} from '@/lib/miniFormLeadSupabase';

/**
 * Validates a French phone number.
 * Allows formats like 0612345678, +33612345678, 06 12 34 56 78, etc.
 * @param {string} phone The phone number to validate.
 * @returns {boolean} True if the phone number is valid.
 */
export const validateFrenchPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Validates an email address.
 * @param {string} email The email to validate.
 * @returns {boolean} True if the email is valid.
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Gets the French region name from a postal code.
 * @param {string} postalCode The postal code (5 digits).
 * @returns {string} The region name or empty string if not found.
 */
export const getRegionFromPostalCode = (postalCode) => {
  if (!postalCode || !/^\d{5}$/.test(postalCode)) return '';

  const code = parseInt(postalCode.substring(0, 2), 10);

  // Mapping des départements aux régions françaises (depuis 2016)
  const departmentToRegion = {
    // Île-de-France
    75: 'Île-de-France', 77: 'Île-de-France', 78: 'Île-de-France',
    91: 'Île-de-France', 92: 'Île-de-France', 93: 'Île-de-France',
    94: 'Île-de-France', 95: 'Île-de-France',
    
    // Centre-Val de Loire
    18: 'Centre-Val de Loire', 28: 'Centre-Val de Loire', 36: 'Centre-Val de Loire',
    37: 'Centre-Val de Loire', 41: 'Centre-Val de Loire', 45: 'Centre-Val de Loire',
    
    // Bourgogne-Franche-Comté
    21: 'Bourgogne-Franche-Comté', 25: 'Bourgogne-Franche-Comté', 39: 'Bourgogne-Franche-Comté',
    58: 'Bourgogne-Franche-Comté', 70: 'Bourgogne-Franche-Comté', 71: 'Bourgogne-Franche-Comté',
    89: 'Bourgogne-Franche-Comté', 90: 'Bourgogne-Franche-Comté',
    
    // Normandie
    14: 'Normandie', 27: 'Normandie', 50: 'Normandie', 61: 'Normandie', 76: 'Normandie',
    
    // Hauts-de-France
    2: 'Hauts-de-France', 59: 'Hauts-de-France', 60: 'Hauts-de-France',
    62: 'Hauts-de-France', 80: 'Hauts-de-France',
    
    // Grand Est
    8: 'Grand Est', 10: 'Grand Est', 51: 'Grand Est', 52: 'Grand Est', 54: 'Grand Est',
    55: 'Grand Est', 57: 'Grand Est', 67: 'Grand Est', 68: 'Grand Est', 88: 'Grand Est',
    
    // Bretagne
    22: 'Bretagne', 29: 'Bretagne', 35: 'Bretagne', 56: 'Bretagne',
    
    // Pays de la Loire
    44: 'Pays de la Loire', 49: 'Pays de la Loire', 53: 'Pays de la Loire',
    72: 'Pays de la Loire', 85: 'Pays de la Loire',
    
    // Nouvelle-Aquitaine
    16: 'Nouvelle-Aquitaine', 17: 'Nouvelle-Aquitaine', 19: 'Nouvelle-Aquitaine',
    23: 'Nouvelle-Aquitaine', 24: 'Nouvelle-Aquitaine', 33: 'Nouvelle-Aquitaine',
    40: 'Nouvelle-Aquitaine', 47: 'Nouvelle-Aquitaine', 64: 'Nouvelle-Aquitaine',
    79: 'Nouvelle-Aquitaine', 86: 'Nouvelle-Aquitaine', 87: 'Nouvelle-Aquitaine',
    
    // Occitanie
    9: 'Occitanie', 11: 'Occitanie', 12: 'Occitanie', 30: 'Occitanie', 31: 'Occitanie',
    32: 'Occitanie', 34: 'Occitanie', 46: 'Occitanie', 48: 'Occitanie', 65: 'Occitanie',
    66: 'Occitanie', 81: 'Occitanie', 82: 'Occitanie',
    
    // Auvergne-Rhône-Alpes
    1: 'Auvergne-Rhône-Alpes', 3: 'Auvergne-Rhône-Alpes', 7: 'Auvergne-Rhône-Alpes',
    15: 'Auvergne-Rhône-Alpes', 26: 'Auvergne-Rhône-Alpes', 38: 'Auvergne-Rhône-Alpes',
    42: 'Auvergne-Rhône-Alpes', 43: 'Auvergne-Rhône-Alpes', 63: 'Auvergne-Rhône-Alpes',
    69: 'Auvergne-Rhône-Alpes', 73: 'Auvergne-Rhône-Alpes', 74: 'Auvergne-Rhône-Alpes',
    
    // Provence-Alpes-Côte d'Azur
    4: 'Provence-Alpes-Côte d\'Azur', 5: 'Provence-Alpes-Côte d\'Azur',
    6: 'Provence-Alpes-Côte d\'Azur', 13: 'Provence-Alpes-Côte d\'Azur',
    83: 'Provence-Alpes-Côte d\'Azur', 84: 'Provence-Alpes-Côte d\'Azur',
    
    // Corse
    20: 'Corse', // 2A et 2B sont gérés séparément
    
    // Outre-Mer
    971: 'Guadeloupe', 972: 'Martinique', 973: 'Guyane', 974: 'La Réunion', 976: 'Mayotte'
  };

  // Gestion spéciale pour la Corse (2A, 2B)
  if (postalCode.startsWith('20')) {
    if (postalCode >= '20000' && postalCode <= '20999') {
      return 'Corse';
    }
  }

  // Gestion de l'outre-mer (codes 97x)
  if (postalCode.startsWith('97')) {
    const omCode = parseInt(postalCode.substring(0, 3), 10);
    return departmentToRegion[omCode] || '';
  }

  return departmentToRegion[code] || '';
};

/**
 * Gets the climatic zone (H1, H2, H3) from a postal code.
 * @param {string} postalCode The postal code (5 digits).
 * @returns {string} The climatic zone (H1, H2, H3) or empty string if not found.
 */
export const getZoneClimatiqueFromPostalCode = (postalCode) => {
  if (!postalCode || !/^\d{5}$/.test(postalCode)) return '';

  const code = parseInt(postalCode.substring(0, 2), 10);

  // Zones climatiques selon la réglementation RT 2012
  // H1 : Nord (températures les plus froides)
  // H2 : Centre (températures moyennes)
  // H3 : Sud (températures les plus chaudes)

  // H1 - Régions les plus froides
  const h1Departments = [
    2, 8, 10, 14, 21, 25, 27, 39, 51, 52, 54, 55, 57, 59, 60, 62, 67, 68, 70, 76, 80, 88, 90
  ];

  // H2 - Régions tempérées (centre) - fusion de H2a et H2b
  const h2Departments = [
    1, 3, 7, 9, 11, 12, 15, 16, 17, 18, 19, 23, 24, 26, 28, 31, 32, 33, 34, 36, 37, 38, 
    40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 53, 56, 58, 61, 63, 64, 65, 66, 69, 71, 72, 73, 
    74, 75, 77, 78, 79, 81, 82, 85, 86, 87, 89, 91, 92, 93, 94, 95
  ];
  
  // H3 - Régions chaudes (sud)
  const h3Departments = [
    4, 5, 6, 13, 30, 83, 84
  ];

  // Gestion spéciale pour la Corse (20xxx)
  if (postalCode.startsWith('20')) {
    return 'H3';
  }

  // Gestion de l'outre-mer (codes 97x)
  if (postalCode.startsWith('97')) {
    return 'H3'; // Outre-mer = zone chaude
  }

  if (h1Departments.includes(code)) {
    return 'H1';
  } else if (h2Departments.includes(code)) {
    return 'H2';
  } else if (h3Departments.includes(code)) {
    return 'H3';
  }

  return '';
};

/**
 * Mini-formulaire accueil : insert `public.leads` (client anon + RLS).
 */
export const handleFormSubmission = async (formData) => {
  try {
    const sanitizedData = sanitizeFormData(formData);

    if (!isMiniFormSupabaseInsertEnabled()) {
      const msg = 'Supabase non configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)';
      logger.error('handleFormSubmission:', msg);
      return { success: false, error: msg };
    }

    const supResult = await insertMiniFormLeadFromSanitized(sanitizedData);
    if (!supResult.success || !supResult.id) {
      const msg = supResult.error || 'Insertion Supabase sans identifiant';
      logger.error('handleFormSubmission Supabase:', msg);
      return { success: false, error: msg };
    }

    return { success: true, data: { id: supResult.id } };
  } catch (error) {
    logger.error('handleFormSubmission error:', error);
    return { success: false, error };
  }
};