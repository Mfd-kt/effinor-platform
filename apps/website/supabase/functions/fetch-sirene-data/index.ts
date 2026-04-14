// Supabase Edge Function pour récupérer les données Sirene INSEE
// Utilise une clé d'intégration directe (X-INSEE-Api-Key-Integration) au lieu de OAuth2

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SIRENE_API_BASE_URL = 'https://api.insee.fr/api-sirene/3.11'

// Récupérer la clé d'intégration depuis les Edge Function Secrets
// Note: Le nouveau portail INSEE utilise des clés d'intégration directes
// au lieu de OAuth2 Client Credentials pour les API publiques
const SIRENE_API_KEY = Deno.env.get('SIRENE_API_KEY') || ''

interface SireneResponse {
  success: boolean
  data?: any
  error?: string
}

serve(async (req) => {
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Vérifier que la clé API est configurée
    if (!SIRENE_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration API manquante. Configurez SIRENE_API_KEY dans les Edge Function Secrets. Obtenez votre clé sur https://portail-api.insee.fr/ après avoir souscrit à l\'API Sirene.',
        } as SireneResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Récupérer le SIREN depuis le body de la requête
    const { siren } = await req.json()

    if (!siren || typeof siren !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SIREN invalide : doit être une chaîne de caractères',
        } as SireneResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Nettoyer le SIREN (enlever les espaces)
    const cleanSiren = siren.replace(/\s/g, '')

    // Vérifier que le SIREN fait 9 chiffres
    if (!/^\d{9}$/.test(cleanSiren)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SIREN invalide : doit contenir exactement 9 chiffres',
        } as SireneResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Étape 1 : Récupérer l'unité légale par SIREN
    const urlUniteLegale = `${SIRENE_API_BASE_URL}/siren/${cleanSiren}`

    const responseUniteLegale = await fetch(urlUniteLegale, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-INSEE-Api-Key-Integration': SIRENE_API_KEY,
      },
    })

    // Vérifier le statut de la réponse
    if (!responseUniteLegale.ok) {
      if (responseUniteLegale.status === 404) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Entreprise non trouvée pour ce SIREN',
          } as SireneResponse),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      if (responseUniteLegale.status === 401 || responseUniteLegale.status === 403) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Erreur d\'authentification API (401/403). Vérifiez votre clé API (X-INSEE-Api-Key-Integration). Obtenez votre clé sur https://portail-api.insee.fr/ après avoir souscrit à l\'API Sirene.',
          } as SireneResponse),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      if (responseUniteLegale.status === 429) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Limite de requêtes atteinte (30/min). Veuillez réessayer plus tard.',
          } as SireneResponse),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      const errorText = await responseUniteLegale.text()
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur API (${responseUniteLegale.status}): ${errorText || 'Erreur inconnue'}`,
        } as SireneResponse),
        {
          status: responseUniteLegale.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Parser la réponse JSON de l'unité légale
    const dataUniteLegale = await responseUniteLegale.json()

    // Vérifier que les données sont valides
    if (!dataUniteLegale || !dataUniteLegale.uniteLegale || !dataUniteLegale.uniteLegale.siren) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Réponse API invalide : données unité légale manquantes',
        } as SireneResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const uniteLegale = dataUniteLegale.uniteLegale
    const periodeActive = uniteLegale.periodesUniteLegale?.find((p) => 
      p.etatAdministratifUniteLegale === 'A'
    ) || uniteLegale.periodesUniteLegale?.[0]

    // Étape 2 : Récupérer l'établissement siège si NIC disponible
    let etablissementSiege = null
    if (periodeActive?.nicSiegeUniteLegale) {
      const siretSiege = uniteLegale.siren + periodeActive.nicSiegeUniteLegale

      if (siretSiege && siretSiege.length === 14) {
        try {
          // Utiliser le groupe de champs prédéfini identificationStandardEtablissement
          // qui inclut les champs d'adresse (numeroVoieEtablissement, libelleVoieEtablissement, etc.)
          const urlEtablissement = `${SIRENE_API_BASE_URL}/siret/${siretSiege}?champs=identificationStandardEtablissement`
          const responseEtablissement = await fetch(urlEtablissement, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-INSEE-Api-Key-Integration': SIRENE_API_KEY,
            },
          })

          if (responseEtablissement.ok) {
            const dataEtablissement = await responseEtablissement.json()
            
            if (dataEtablissement.etablissement) {
              etablissementSiege = dataEtablissement.etablissement
            } else if (dataEtablissement.etablissements && dataEtablissement.etablissements[0]) {
              etablissementSiege = dataEtablissement.etablissements[0]
            }
          }
        } catch (error) {
          // Si l'établissement n'a pas pu être récupéré, on continue quand même
          console.warn(`Could not fetch établissement for SIRET ${siretSiege}:`, error)
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
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedData,
      } as SireneResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('[Sirene Edge Function] Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors de la récupération des données',
      } as SireneResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
