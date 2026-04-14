import { logger } from '@/utils/logger';

const FORM_STORAGE_KEY = 'cee_eligibility_form_data';

/**
 * Saves form data to localStorage.
 * @param {object} data The data to save.
 * @returns {boolean} True if successful, false otherwise.
 */
export const saveFormData = (data) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error saving form data to localStorage:', error);
    return false;
  }
};

/**
 * Loads form data from localStorage.
 * @returns {object|null} The parsed data or null if not found or error.
 */
export const loadFormData = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(FORM_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (error) {
    logger.error('Error loading form data from localStorage:', error);
    return null;
  }
};

/**
 * Clears form data from localStorage.
 * @returns {boolean} True if successful, false otherwise.
 */
export const clearFormData = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(FORM_STORAGE_KEY);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error clearing form data from localStorage:', error);
    return false;
  }
};

/**
 * Récupère les données du formulaire depuis les paramètres d'URL
 * @returns {Object} Données du formulaire depuis l'URL
 */
export const getFormDataFromUrl = () => {
  try {
    if (typeof window === 'undefined') return {};
    
    const urlParams = new URLSearchParams(window.location.search);
    const formData = {};
    
    // Récupérer les champs depuis l'URL
    const nom = urlParams.get('nom');
    const prenom = urlParams.get('prenom');
    const email = urlParams.get('email');
    const telephone = urlParams.get('telephone');
    const code_postal = urlParams.get('code_postal');
    const societe = urlParams.get('societe');
    const leadId = urlParams.get('leadId');
    
    // Construire l'objet de données avec décodage URL
    if (nom) {
      formData.nom = decodeURIComponent(nom);
    }
    if (prenom) {
      formData.prenom = decodeURIComponent(prenom);
    }
    if (email) {
      formData.email = decodeURIComponent(email);
    }
    if (telephone) {
      formData.telephone = decodeURIComponent(telephone);
    }
    if (code_postal) {
      formData.code_postal = decodeURIComponent(code_postal);
    }
    if (societe) {
      formData.societe = decodeURIComponent(societe);
    }
    if (leadId) {
      formData.leadId = leadId;
      // Stocker le leadId dans localStorage pour la sauvegarde progressive
      localStorage.setItem('current_lead_id', leadId);
    }
    
    // Log de debug en développement
    if (import.meta.env.DEV && Object.keys(formData).length > 0) {
      logger.debug('📥 Données récupérées depuis l\'URL:', formData);
    }
    
    return formData;
  } catch (error) {
    logger.error('Error getting form data from URL:', error);
    return {};
  }
};