import { logger } from '@/utils/logger';

/**
 * API Sirene INSEE - Récupération des données d'entreprise par SIREN
 * Documentation: https://www.data.gouv.fr/dataservices/api-sirene-open-data
 * Documentation technique: https://www.sirene.fr/static-resources/documentation/sommaire_311.html
 * Portail API: https://portail-api.insee.fr/
 */

const SIRENE_API_BASE_URL = 'https://api.insee.fr/api-sirene/3.11';
const SIRENE_API_TOKEN = import.meta.env.VITE_SIRENE_API_TOKEN;

/**
 * Construit le SIRET du siège depuis les données Sirene
 * Le SIRET = SIREN (9 chiffres) + NIC siège (5 chiffres)
 * @param {string} siren - Numéro SIREN (9 chiffres)
 * @param {string} nicSiege - NIC du siège (5 chiffres) depuis periodesUniteLegale[0].nicSiegeUniteLegale
 * @returns {string|null} - SIRET complet (14 chiffres) ou null
 */
const buildSiretFromSirenAndNic = (siren, nicSiege) => {
  if (!siren || !nicSiege) return null;
  
  const cleanSiren = siren.replace(/\s/g, '');
  const cleanNic = nicSiege.replace(/\s/g, '');
  
  // Vérifier que SIREN fait 9 chiffres et NIC fait 5 chiffres
  if (!/^\d{9}$/.test(cleanSiren) || !/^\d{5}$/.test(cleanNic)) {
    return null;
  }
  
  return cleanSiren + cleanNic;
};

/**
 * Récupère les données de l'établissement siège depuis l'API Sirene par SIRET
 * @param {string} siret - Numéro SIRET (14 chiffres)
 * @param {string} token - Token OAuth2 pour l'authentification
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
const fetchEstablishmentBySiret = async (siret, token) => {
  try {
    const url = `${SIRENE_API_BASE_URL}/siret/${siret}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Établissement non trouvé pour ce SIRET' };
      }
      
      const errorText = await response.text();
      logger.error(`[Sirene API] Error ${response.status} for SIRET ${siret}: ${errorText}`);
      return { success: false, error: `Erreur API (${response.status})` };
    }

    const data = await response.json();
    
    // La réponse de l'endpoint /siret/{siret} a la structure :
    // { header: {...}, etablissement: {...} } ou { header: {...}, etablissements: [{...}] }
    let etablissement = null;
    
    if (data.etablissement) {
      // Structure standard avec objet etablissement unique
      etablissement = data.etablissement;
    } else if (data.etablissements && Array.isArray(data.etablissements) && data.etablissements.length > 0) {
      // Structure alternative avec tableau etablissements
      etablissement = data.etablissements[0];
    } else {
      logger.warn('[Sirene API] Unexpected response structure for SIRET endpoint:', data);
      return { success: false, error: 'Structure de réponse inattendue pour l\'établissement' };
    }
    
    if (!etablissement) {
      return { success: false, error: 'Réponse API invalide : établissement manquant' };
    }

    return { success: true, data: etablissement };
  } catch (error) {
    logger.error('[Sirene API] Network error fetching establishment:', error);
    return { success: false, error: 'Erreur réseau lors de la récupération de l\'établissement' };
  }
};

/**
 * Mappe les données de l'API Sirene vers les champs du Lead
 * @param {Object} uniteLegaleData - Données de l'unité légale retournées par l'API Sirene
 * @param {Object} etablissementData - Données de l'établissement siège (optionnel)
 * @returns {Object} - Objet avec les champs mappés pour le lead
 */
export const mapSireneToLead = (uniteLegaleData, etablissementData = null) => {
  // Récupérer la période active (la plus récente ou celle avec étatAdministratifUniteLegale = "A")
  const periodeActive = uniteLegaleData.periodesUniteLegale?.find(p => 
    p.etatAdministratifUniteLegale === 'A'
  ) || uniteLegaleData.periodesUniteLegale?.[0];

  const mapped = {
    siren: uniteLegaleData.siren || null,
    societe: periodeActive?.denominationUniteLegale || periodeActive?.nomUniteLegale || null,
  };

  // Construire le SIRET du siège si NIC disponible
  if (uniteLegaleData.siren && periodeActive?.nicSiegeUniteLegale) {
    const siret = buildSiretFromSirenAndNic(uniteLegaleData.siren, periodeActive.nicSiegeUniteLegale);
    if (siret) {
      mapped.siret = siret;
    }
  }

  // Si on a les données de l'établissement siège, utiliser l'adresse
  if (etablissementData && etablissementData.periodesEtablissement?.[0]) {
    const periodeEtab = etablissementData.periodesEtablissement[0];
    
    // Construire l'adresse complète
    const addressParts = [
      periodeEtab.numeroVoieEtablissement,
      periodeEtab.indiceRepetitionEtablissement,
      periodeEtab.typeVoieEtablissement,
      periodeEtab.libelleVoieEtablissement,
      periodeEtab.complementAdresseEtablissement
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      mapped.adresse_siege = addressParts.join(' ');
    }
    
    mapped.ville_siege = periodeEtab.libelleCommuneEtablissement || null;
    mapped.code_postal_siege = periodeEtab.codePostalEtablissement || null;
  }

  // Retirer les valeurs null pour éviter d'écraser des données existantes avec null
  Object.keys(mapped).forEach(key => {
    if (mapped[key] === null) {
      delete mapped[key];
    }
  });

  return mapped;
};

/**
 * Récupère les données d'une entreprise depuis l'API Sirene INSEE par son SIREN
 * Fait deux appels : un pour l'unité légale, un pour l'établissement siège (si disponible)
 * @param {string} siren - Numéro SIREN (9 chiffres)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const fetchCompanyBySiren = async (siren) => {
  // Validation du SIREN
  if (!siren || typeof siren !== 'string') {
    return {
      success: false,
      error: 'SIREN invalide : doit être une chaîne de caractères'
    };
  }

  // Nettoyer le SIREN (enlever les espaces)
  const cleanSiren = siren.replace(/\s/g, '');

  // Vérifier que le SIREN fait 9 chiffres
  if (!/^\d{9}$/.test(cleanSiren)) {
    return {
      success: false,
      error: 'SIREN invalide : doit contenir exactement 9 chiffres'
    };
  }

  // Vérifier que le token API est configuré
  if (!SIRENE_API_TOKEN) {
    logger.error('VITE_SIRENE_API_TOKEN not configured in environment variables');
    return {
      success: false,
      error: 'Configuration API manquante. Veuillez configurer VITE_SIRENE_API_TOKEN dans votre fichier .env. Obtenez votre token sur https://portail-api.insee.fr/'
    };
  }

  try {
    // Étape 1 : Récupérer l'unité légale par SIREN
    const urlUniteLegale = `${SIRENE_API_BASE_URL}/siren/${cleanSiren}`;

    logger.log(`[Sirene API] Fetching unité légale for SIREN: ${cleanSiren}`);

    const responseUniteLegale = await fetch(urlUniteLegale, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SIRENE_API_TOKEN}`,
      },
    });

    // Vérifier le statut de la réponse
    if (!responseUniteLegale.ok) {
      if (responseUniteLegale.status === 404) {
        return {
          success: false,
          error: 'Entreprise non trouvée pour ce SIREN'
        };
      }

      if (responseUniteLegale.status === 401 || responseUniteLegale.status === 403) {
        return {
          success: false,
          error: 'Erreur d\'authentification API. Vérifiez votre token OAuth2. Obtenez-le sur https://portail-api.insee.fr/'
        };
      }

      if (responseUniteLegale.status === 429) {
        return {
          success: false,
          error: 'Limite de requêtes atteinte (30/min). Veuillez réessayer plus tard.'
        };
      }

      const errorText = await responseUniteLegale.text();
      logger.error(`[Sirene API] Error ${responseUniteLegale.status}: ${errorText}`);
      
      return {
        success: false,
        error: `Erreur API (${responseUniteLegale.status}): ${errorText || 'Erreur inconnue'}`
      };
    }

    // Parser la réponse JSON de l'unité légale
    const dataUniteLegale = await responseUniteLegale.json();

    // Vérifier que les données sont valides
    if (!dataUniteLegale || !dataUniteLegale.uniteLegale || !dataUniteLegale.uniteLegale.siren) {
      return {
        success: false,
        error: 'Réponse API invalide : données unité légale manquantes'
      };
    }

    const uniteLegale = dataUniteLegale.uniteLegale;
    const periodeActive = uniteLegale.periodesUniteLegale?.find(p => 
      p.etatAdministratifUniteLegale === 'A'
    ) || uniteLegale.periodesUniteLegale?.[0];

    // Étape 2 : Récupérer l'établissement siège si NIC disponible
    // Si l'appel échoue, on continue quand même avec les données de l'unité légale
    let etablissementSiege = null;
    if (periodeActive?.nicSiegeUniteLegale) {
      const siretSiege = buildSiretFromSirenAndNic(uniteLegale.siren, periodeActive.nicSiegeUniteLegale);
      
      if (siretSiege) {
        try {
          logger.log(`[Sirene API] Fetching établissement siège for SIRET: ${siretSiege}`);
          const etabResult = await fetchEstablishmentBySiret(siretSiege, SIRENE_API_TOKEN);
          
          if (etabResult.success && etabResult.data) {
            etablissementSiege = etabResult.data;
          } else {
            // L'établissement n'a pas pu être récupéré, mais on continue quand même
            logger.warn(`[Sirene API] Could not fetch établissement for SIRET ${siretSiege}: ${etabResult.error || 'Unknown error'}`);
          }
        } catch (error) {
          // Erreur lors de la récupération de l'établissement, on continue quand même
          logger.warn(`[Sirene API] Error fetching établissement for SIRET ${siretSiege}:`, error);
        }
      }
    }

    // Mapper les données vers le format attendu par le composant
    const mappedData = {
      siren: uniteLegale.siren,
      denomination: periodeActive?.denominationUniteLegale || periodeActive?.nomUniteLegale || null,
      denominationUsuelle: periodeActive?.denominationUsuelle1UniteLegale || null,
      uniteLegale: uniteLegale,
      etablissementSiege: etablissementSiege,
    };

    const companyName = mappedData.denomination || mappedData.denominationUsuelle || 'Entreprise';
    logger.log(`[Sirene API] Successfully fetched data for: ${companyName}`);

    return {
      success: true,
      data: mappedData
    };

  } catch (error) {
    // Gestion des erreurs réseau
    logger.error('[Sirene API] Network error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Erreur réseau. Vérifiez votre connexion internet.'
      };
    }

    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des données'
    };
  }
};

/**
 * Alias pour compatibilité - Mappe les données Sirene vers les champs du Lead
 * @param {Object} sireneData - Données retournées par fetchCompanyBySiren
 * @returns {Object} - Objet avec les champs mappés pour le lead
 */
export const mapPappersToLead = (sireneData) => {
  return mapSireneToLead(sireneData.uniteLegale, sireneData.etablissementSiege);
};

