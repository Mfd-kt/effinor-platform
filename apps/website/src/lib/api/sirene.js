import { logger } from '@/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * API Sirene INSEE - Récupération des données d'entreprise par SIREN
 * Documentation: https://www.data.gouv.fr/dataservices/api-sirene-open-data
 * Documentation technique: https://www.sirene.fr/static-resources/documentation/sommaire_311.html
 * Portail API: https://portail-api.insee.fr/
 * Documentation OpenAPI: https://api-apimanager.insee.fr/portal/environments/DEFAULT/apis/2ba0e549-5587-3ef1-9082-99cd865de66f/pages/6548510e-c3e1-3099-be96-6edf02870699/content
 * 
 * Note: Les appels sont faits via une Supabase Edge Function (fetch-sirene-data) qui utilise OAuth2 Client Credentials
 * pour éviter les problèmes CORS. L'Edge Function doit être déployée et les secrets SIRENE_CLIENT_ID et SIRENE_CLIENT_SECRET
 * doivent être configurés dans Supabase Dashboard > Settings > Functions > Secrets
 * 
 * Authentification: OAuth2 Client Credentials flow (Bearer token)
 */

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

// La fonction fetchEstablishmentBySiret a été déplacée dans la Supabase Edge Function
// pour éviter les problèmes CORS. L'appel est maintenant géré côté serveur.

/**
 * Mappe les données de l'API Sirene vers les champs du Lead
 * @param {Object} dataFromSQL - Données retournées par la fonction SQL (contient uniteLegale et etablissementSiege)
 * @returns {Object} - Objet avec les champs mappés pour le lead
 */
export const mapSireneToLead = (dataFromSQL) => {
  if (!dataFromSQL) {
    return {};
  }

  // L'Edge Function retourne { siren, denomination, denominationUsuelle, uniteLegale, etablissementSiege }
  const uniteLegaleData = dataFromSQL.uniteLegale || dataFromSQL;
  const etablissementData = dataFromSQL.etablissementSiege || null;

  // Extraire les informations de base (priorité au format structuré SQL, sinon parser depuis uniteLegale)
  let siren, denomination, denominationUsuelle, nicSiege;
  
  if (dataFromSQL.siren || dataFromSQL.denomination) {
    // Format structuré retourné directement par la fonction SQL
    siren = dataFromSQL.siren || null;
    denomination = dataFromSQL.denomination || null;
    denominationUsuelle = dataFromSQL.denominationUsuelle || null;
    // Essayer de récupérer nicSiege depuis uniteLegale si pas directement disponible
    if (uniteLegaleData && uniteLegaleData.periodesUniteLegale) {
      const periodeActive = uniteLegaleData.periodesUniteLegale.find(p => 
        p.etatAdministratifUniteLegale === 'A'
      ) || uniteLegaleData.periodesUniteLegale[0];
      nicSiege = periodeActive?.nicSiegeUniteLegale || null;
    }
  } else if (uniteLegaleData) {
    // Format brut de l'API (uniteLegale brut)
    siren = uniteLegaleData.siren || null;
    const periodesUniteLegale = uniteLegaleData.periodesUniteLegale;
    if (periodesUniteLegale && periodesUniteLegale.length > 0) {
      const periodeActive = periodesUniteLegale.find(p => 
        p.etatAdministratifUniteLegale === 'A'
      ) || periodesUniteLegale[0];
      denomination = periodeActive?.denominationUniteLegale || periodeActive?.nomUniteLegale || null;
      denominationUsuelle = periodeActive?.denominationUsuelle1UniteLegale || null;
      nicSiege = periodeActive?.nicSiegeUniteLegale || null;
    }
  }

  const mapped = {
    siren: siren || null,
    societe: denomination || denominationUsuelle || null,
  };

  // Construire le SIRET du siège si NIC disponible
  if (siren && nicSiege) {
    const siret = buildSiretFromSirenAndNic(siren, nicSiege);
    if (siret) {
      mapped.siret = siret;
    }
  }

  // Si on a les données de l'établissement siège, utiliser l'adresse
  if (etablissementData) {
    // PRIORITÉ 1: L'API Sirene retourne l'adresse dans etablissementData.adresseEtablissement
    // (pas dans periodesEtablissement[0])
    if (etablissementData.adresseEtablissement) {
      const adresse = etablissementData.adresseEtablissement;
      
      // Construire l'adresse complète
      const addressParts = [
        adresse.numeroVoieEtablissement,
        adresse.indiceRepetitionEtablissement,
        adresse.typeVoieEtablissement,
        adresse.libelleVoieEtablissement,
        adresse.complementAdresseEtablissement
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        mapped.adresse_siege = addressParts.join(' ');
      }
      
      if (adresse.codePostalEtablissement) {
        mapped.code_postal_siege = adresse.codePostalEtablissement;
      }
      
      if (adresse.libelleCommuneEtablissement) {
        mapped.ville_siege = adresse.libelleCommuneEtablissement;
      }
    }
    
    // Fallback 1: chercher dans periodesEtablissement[0] si adresseEtablissement n'existe pas
    if (!mapped.adresse_siege && etablissementData.periodesEtablissement && etablissementData.periodesEtablissement.length > 0) {
      const periodeEtab = etablissementData.periodesEtablissement.find(p => 
        p.etatAdministratifEtablissement === 'A'
      ) || etablissementData.periodesEtablissement[0];
      
      if (periodeEtab) {
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
        
        if (periodeEtab.codePostalEtablissement) {
          mapped.code_postal_siege = periodeEtab.codePostalEtablissement;
        }
        
        if (periodeEtab.libelleCommuneEtablissement) {
          mapped.ville_siege = periodeEtab.libelleCommuneEtablissement;
        }
      }
    }
    
    // Fallback 2: chercher dans etablissementData.adresse (format structuré de l'ancienne fonction SQL)
    if (!mapped.adresse_siege && etablissementData.adresse) {
      const adresse = etablissementData.adresse;
      const addressParts = [
        adresse.numeroVoie,
        adresse.indiceRepetition,
        adresse.typeVoie,
        adresse.libelleVoie,
        adresse.complement
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        mapped.adresse_siege = addressParts.join(' ');
      }
      
      mapped.ville_siege = adresse.ville || mapped.ville_siege || null;
      mapped.code_postal_siege = adresse.codePostal || mapped.code_postal_siege || null;
    }
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
 * Utilise une Supabase Edge Function qui appelle l'API Sirene via OAuth2 Client Credentials
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

  try {
    logger.log(`[Sirene API] Fetching company data for SIREN: ${cleanSiren} via Edge Function`);

    // Appel à la Supabase Edge Function
    const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('fetch-sirene-data', {
      body: { siren: cleanSiren },
    });

    if (edgeError) {
      logger.error('[Sirene API] Edge Function error:', edgeError);
      return {
        success: false,
        error: edgeError.message || 'Erreur lors de l\'appel à l\'Edge Function. Assurez-vous que l\'Edge Function fetch-sirene-data est déployée et que les secrets SIRENE_CLIENT_ID et SIRENE_CLIENT_SECRET sont configurés dans Supabase Dashboard > Settings > Functions > Secrets.'
      };
    }

    // La réponse de l'Edge Function contient déjà { success, data, error }
    if (edgeResult && edgeResult.success) {
      const companyData = edgeResult.data || {};
      const companyName = companyData.denomination || companyData.denominationUsuelle || 'Entreprise';
      logger.log(`[Sirene API] Successfully fetched data for: ${companyName}`);
      return {
        success: true,
        data: companyData
      };
    } else {
      return {
        success: false,
        error: edgeResult?.error || 'Erreur lors de la récupération des données'
      };
    }

  } catch (error) {
    // Gestion des erreurs réseau
    logger.error('[Sirene API] Network error:', error);
    
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des données. Vérifiez que l\'Edge Function fetch-sirene-data est déployée et que les secrets OAuth2 sont configurés.'
    };
  }
};


