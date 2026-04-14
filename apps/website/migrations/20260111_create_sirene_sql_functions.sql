-- Migration: Fonction SQL pour récupérer les données Sirene INSEE
-- Date: 2026-01-11
-- Description: Crée une fonction PostgreSQL qui appelle l'API Sirene INSEE
--              pour récupérer les données d'entreprise par SIREN
--              Utilise l'extension pg_net pour les appels HTTP

-- ============================================
-- ÉTAPE 1: Activer l'extension pg_net
-- ============================================
-- Note: pg_net est généralement déjà activé dans Supabase
-- Si ce n'est pas le cas, activez-le via le dashboard Supabase
-- ou décommentez la ligne suivante:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- ÉTAPE 2: Fonction helper pour parser le JSON de l'unité légale
-- ============================================
CREATE OR REPLACE FUNCTION public.parse_unite_legale_sirene(response_json JSONB)
RETURNS JSONB AS $$
DECLARE
  unite_legale JSONB;
  periode_active JSONB;
  result JSONB;
  periodes_array JSONB;
BEGIN
  -- Extraire l'unité légale depuis la réponse
  unite_legale := response_json->'uniteLegale';
  
  IF unite_legale IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Extraire le tableau des périodes
  periodes_array := unite_legale->'periodesUniteLegale';
  
  IF periodes_array IS NULL OR jsonb_array_length(periodes_array) = 0 THEN
    RETURN jsonb_build_object(
      'siren', unite_legale->>'siren',
      'denomination', NULL,
      'denominationUsuelle', NULL,
      'nicSiege', NULL,
      'uniteLegale', unite_legale
    );
  END IF;
  
  -- Trouver la période active (étatAdministratifUniteLegale = 'A')
  SELECT jsonb_array_elem INTO periode_active
  FROM jsonb_array_elements(periodes_array) AS jsonb_array_elem
  WHERE (jsonb_array_elem->>'etatAdministratifUniteLegale') = 'A'
  LIMIT 1;
  
  -- Si pas de période active, prendre la première
  IF periode_active IS NULL THEN
    periode_active := periodes_array->0;
  END IF;
  
  -- Construire le résultat
  result := jsonb_build_object(
    'siren', unite_legale->>'siren',
    'denomination', COALESCE(
      periode_active->>'denominationUniteLegale',
      periode_active->>'nomUniteLegale'
    ),
    'denominationUsuelle', periode_active->>'denominationUsuelle1UniteLegale',
    'nicSiege', periode_active->>'nicSiegeUniteLegale',
    'uniteLegale', unite_legale
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ÉTAPE 3: Fonction helper pour parser le JSON de l'établissement
-- ============================================
CREATE OR REPLACE FUNCTION public.parse_etablissement_sirene(response_json JSONB)
RETURNS JSONB AS $$
DECLARE
  etablissement JSONB;
  periode_etab JSONB;
  periodes_array JSONB;
BEGIN
  -- Essayer d'extraire l'établissement (structure peut varier)
  etablissement := COALESCE(
    response_json->'etablissement',
    (response_json->'etablissements')->0
  );
  
  IF etablissement IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Extraire le tableau des périodes de l'établissement
  periodes_array := etablissement->'periodesEtablissement';
  
  IF periodes_array IS NULL OR jsonb_array_length(periodes_array) = 0 THEN
    RETURN etablissement;
  END IF;
  
  -- Extraire la première période (ou période active si disponible)
  periode_etab := periodes_array->0;
  
  -- Construire l'adresse complète
  RETURN jsonb_build_object(
    'siret', etablissement->>'siret',
    'adresse', jsonb_build_object(
      'numeroVoie', periode_etab->>'numeroVoieEtablissement',
      'indiceRepetition', periode_etab->>'indiceRepetitionEtablissement',
      'typeVoie', periode_etab->>'typeVoieEtablissement',
      'libelleVoie', periode_etab->>'libelleVoieEtablissement',
      'complement', periode_etab->>'complementAdresseEtablissement',
      'codePostal', periode_etab->>'codePostalEtablissement',
      'ville', periode_etab->>'libelleCommuneEtablissement'
    ),
    'etablissement', etablissement
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- ÉTAPE 4: Fonction pour obtenir un token OAuth2
-- ============================================
CREATE OR REPLACE FUNCTION public.get_sirene_oauth2_token()
RETURNS TEXT AS $$
DECLARE
  client_id TEXT;
  client_secret TEXT;
  token_url TEXT := 'https://api.insee.fr/token';
  request_body TEXT;
  request_id BIGINT;
  completed_response RECORD;
  wait_seconds INT := 0;
  max_wait_seconds INT := 10;
  token_response JSONB;
  access_token TEXT;
BEGIN
  -- Récupérer les credentials OAuth2 depuis les secrets
  client_id := COALESCE(
    current_setting('app.sirene_client_id', true),
    current_setting('sirene.client_id', true)
  );
  
  client_secret := COALESCE(
    current_setting('app.sirene_client_secret', true),
    current_setting('sirene.client_secret', true)
  );
  
  IF client_id IS NULL OR client_id = '' THEN
    RAISE EXCEPTION 'Client ID OAuth2 manquant. Configurez app.sirene_client_id dans les secrets Supabase.';
  END IF;
  
  IF client_secret IS NULL OR client_secret = '' THEN
    RAISE EXCEPTION 'Client Secret OAuth2 manquant. Configurez app.sirene_client_secret dans les secrets Supabase.';
  END IF;
  
  -- Construire le body de la requête OAuth2 Client Credentials
  -- Note: Les valeurs doivent être URL-encodées (encodeURIComponent en JS)
  -- Pour PostgreSQL, on utilise une approche simple (si pas de caractères spéciaux)
  -- Sinon, il faudrait utiliser une fonction d'encodage URL
  request_body := 'grant_type=client_credentials&client_id=' || 
    REPLACE(REPLACE(REPLACE(client_id, '%', '%25'), '&', '%26'), '=', '%3D') ||
    '&client_secret=' || 
    REPLACE(REPLACE(REPLACE(client_secret, '%', '%25'), '&', '%26'), '=', '%3D');
  
  -- Faire la requête POST pour obtenir le token
  BEGIN
    SELECT net.http_post(
      url := token_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/x-www-form-urlencoded',
        'Accept', 'application/json'
      )::jsonb,
      body := request_body
    ) INTO request_id;
    
    -- Attendre la réponse
    wait_seconds := 0;
    WHILE wait_seconds < max_wait_seconds LOOP
      SELECT * INTO completed_response
      FROM net.http_post_completed(request_id);
      
      IF completed_response IS NOT NULL THEN
        IF completed_response.status_code = 200 THEN
          token_response := completed_response.content::jsonb;
          access_token := token_response->>'access_token';
          
          IF access_token IS NULL OR access_token = '' THEN
            RAISE EXCEPTION 'Token OAuth2 invalide reçu: %', token_response::text;
          END IF;
          
          RETURN access_token;
        ELSIF completed_response.status_code IN (401, 403) THEN
          RAISE EXCEPTION 'Erreur d''authentification OAuth2 (401/403). Vérifiez votre Client ID et Client Secret.';
        ELSE
          RAISE EXCEPTION 'Erreur lors de l''obtention du token OAuth2 (code %): %', 
            completed_response.status_code, 
            COALESCE(completed_response.content::text, 'Erreur inconnue');
        END IF;
      END IF;
      
      PERFORM pg_sleep(0.2);
      wait_seconds := wait_seconds + 1;
    END LOOP;
    
    RAISE EXCEPTION 'Timeout lors de l''obtention du token OAuth2';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de l''appel OAuth2: %', SQLERRM;
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 5: Fonction principale pour récupérer les données Sirene
-- ============================================
CREATE OR REPLACE FUNCTION public.fetch_sirene_data_by_siren(
  p_siren TEXT,
  p_access_token TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  clean_siren TEXT;
  access_token TEXT;
  api_base_url TEXT := 'https://api.insee.fr/api-sirene/3.11';
  url_unite_legale TEXT;
  url_etablissement TEXT;
  response_unite_legale JSONB;
  response_etablissement JSONB;
  unite_legale_data JSONB;
  etablissement_data JSONB;
  siret_siege TEXT;
  final_result JSONB;
  request_id BIGINT;
  max_wait_seconds INT := 10;
  wait_seconds INT := 0;
  completed_response RECORD;
  request_id_etab BIGINT;
  wait_seconds_etab INT;
  completed_response_etab RECORD;
BEGIN
  -- Validation du SIREN
  clean_siren := REGEXP_REPLACE(p_siren, '[^0-9]', '', 'g');
  
  IF LENGTH(clean_siren) != 9 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SIREN invalide : doit contenir exactement 9 chiffres'
    );
  END IF;
  
  -- Obtenir le token OAuth2 (si non fourni en paramètre)
  -- Priorité: paramètre > génération via OAuth2
  IF p_access_token IS NULL OR p_access_token = '' THEN
    BEGIN
      access_token := public.get_sirene_oauth2_token();
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Impossible d''obtenir le token OAuth2: ' || SQLERRM || '. Vérifiez que app.sirene_client_id et app.sirene_client_secret sont configurés dans les secrets Supabase.'
      );
    END;
  ELSE
    access_token := p_access_token;
  END IF;
  
  -- ÉTAPE 1: Récupérer l'unité légale via pg_net
  url_unite_legale := api_base_url || '/siren/' || clean_siren;
  
  BEGIN
    -- Initier la requête HTTP via pg_net
    -- Note: net.http_get retourne un request_id (BIGINT)
    -- On doit ensuite utiliser net.http_get_completed pour récupérer la réponse
    SELECT net.http_get(
      url := url_unite_legale,
      headers := jsonb_build_object(
        'Accept', 'application/json',
        'Authorization', 'Bearer ' || access_token
      )::jsonb
    ) INTO request_id;
    
    -- Réinitialiser les compteurs pour la boucle d'attente
    wait_seconds := 0;
    
    -- Attendre que la requête soit terminée (avec timeout)
    WHILE wait_seconds < max_wait_seconds LOOP
      SELECT * INTO completed_response
      FROM net.http_get_completed(request_id);
      
      IF completed_response IS NOT NULL THEN
        -- Vérifier le statut HTTP
        IF completed_response.status_code = 200 THEN
          response_unite_legale := completed_response.content::jsonb;
          EXIT;
        ELSIF completed_response.status_code = 404 THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Entreprise non trouvée pour ce SIREN'
          );
        ELSIF completed_response.status_code IN (401, 403) THEN
          -- Si 401, le token a peut-être expiré, essayer d'en obtenir un nouveau
          BEGIN
            access_token := public.get_sirene_oauth2_token();
            -- Réessayer avec le nouveau token (on retourne une erreur pour l'instant, pourrait être amélioré avec retry)
            RETURN jsonb_build_object(
              'success', false,
              'error', 'Erreur d''authentification API (401/403). Le token OAuth2 a peut-être expiré. Réessayez la requête.'
            );
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object(
              'success', false,
              'error', 'Erreur d''authentification API (401/403). Vérifiez votre Client ID et Client Secret OAuth2 sur https://portail-api.insee.fr/'
            );
          END;
        ELSIF completed_response.status_code = 429 THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Limite de requêtes atteinte (30/min). Veuillez réessayer plus tard.'
          );
        ELSE
          RETURN jsonb_build_object(
            'success', false,
            'error', 'Erreur API (' || completed_response.status_code || '): ' || COALESCE(completed_response.content::text, 'Erreur inconnue')
          );
        END IF;
      END IF;
      
      -- Attendre 200ms avant de réessayer
      PERFORM pg_sleep(0.2);
      wait_seconds := wait_seconds + 1;
    END LOOP;
    
    -- Si on arrive ici sans réponse, c'est un timeout
    IF response_unite_legale IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Timeout lors de l''appel à l''API Sirene. La requête prend trop de temps.'
      );
    END IF;
    
  EXCEPTION 
    WHEN undefined_function THEN
      -- Si net.http_get_completed n'existe pas, utiliser une Edge Function
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Extension pg_net non configurée correctement. Contactez le support Supabase ou utilisez une Supabase Edge Function.'
      );
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Erreur lors de la récupération de l''unité légale: ' || SQLERRM || '. Vérifiez que l''extension pg_net est activée.'
      );
  END;
  
  -- Extraire et parser les données de l'unité légale
  unite_legale_data := public.parse_unite_legale_sirene(response_unite_legale);
  
  IF unite_legale_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Réponse API invalide : données unité légale manquantes'
    );
  END IF;
  
  -- ÉTAPE 2: Récupérer l'établissement siège si NIC disponible
  etablissement_data := NULL;
  IF unite_legale_data->>'nicSiege' IS NOT NULL AND (unite_legale_data->>'nicSiege') != '' THEN
    siret_siege := clean_siren || (unite_legale_data->>'nicSiege');
    
    IF LENGTH(siret_siege) = 14 THEN
      url_etablissement := api_base_url || '/siret/' || siret_siege;
      
      BEGIN
        -- Initier la requête HTTP pour l'établissement
        SELECT net.http_get(
          url := url_etablissement,
          headers := jsonb_build_object(
            'Accept', 'application/json',
            'Authorization', 'Bearer ' || access_token
          )::jsonb
        ) INTO request_id_etab;
        
        -- Réinitialiser le compteur pour la boucle d'attente
        wait_seconds_etab := 0;
        
        -- Attendre la réponse (avec timeout plus court)
        WHILE wait_seconds_etab < 5 LOOP
          SELECT * INTO completed_response_etab
          FROM net.http_get_completed(request_id_etab);
          
          IF completed_response_etab IS NOT NULL AND completed_response_etab.status_code = 200 THEN
            response_etablissement := completed_response_etab.content::jsonb;
            etablissement_data := public.parse_etablissement_sirene(response_etablissement);
            EXIT;
          ELSIF completed_response_etab IS NOT NULL THEN
            -- Si erreur HTTP, on continue sans établissement
            EXIT;
          END IF;
          
          PERFORM pg_sleep(0.2);
          wait_seconds_etab := wait_seconds_etab + 1;
        END LOOP;
        
      EXCEPTION WHEN OTHERS THEN
        -- Si l'établissement ne peut pas être récupéré, on continue quand même
        RAISE NOTICE 'Erreur lors de la récupération de l''établissement: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  -- Construire le résultat final
  final_result := jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'siren', unite_legale_data->>'siren',
      'denomination', unite_legale_data->>'denomination',
      'denominationUsuelle', unite_legale_data->>'denominationUsuelle',
      'uniteLegale', unite_legale_data->'uniteLegale',
      'etablissementSiege', etablissement_data
    )
  );
  
  RETURN final_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erreur inattendue: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 6: Fonction wrapper simplifiée pour les leads
-- ============================================
-- Cette fonction peut être appelée depuis le frontend via Supabase RPC
CREATE OR REPLACE FUNCTION public.get_sirene_data_for_lead(
  p_siren TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- La fonction fetch_sirene_data_by_siren gère automatiquement l'obtention du token OAuth2
  -- Elle récupère les credentials depuis les secrets Supabase:
  -- - app.sirene_client_id
  -- - app.sirene_client_secret
  RETURN public.fetch_sirene_data_by_siren(p_siren, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_sirene_data_for_lead(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_sirene_data_by_siren(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sirene_oauth2_token() TO authenticated;

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON FUNCTION public.get_sirene_oauth2_token() IS 
'Fonction pour obtenir un token OAuth2 via Client Credentials flow.
Utilise app.sirene_client_id et app.sirene_client_secret depuis les secrets Supabase.
Endpoint: https://api.insee.fr/token';

COMMENT ON FUNCTION public.get_sirene_data_for_lead(TEXT) IS 
'Fonction RPC pour récupérer les données Sirene par SIREN depuis le frontend.
Utilise l''API Sirene INSEE (https://api.insee.fr/api-sirene/3.11) avec authentification OAuth2 Bearer.
Appel: SELECT * FROM get_sirene_data_for_lead(''907547665'');
Ou depuis le frontend: supabase.rpc("get_sirene_data_for_lead", { p_siren: "907547665" })
Configuration: Configurez app.sirene_client_id et app.sirene_client_secret dans les secrets Supabase.
Documentation: https://api-apimanager.insee.fr/portal/environments/DEFAULT/apis/2ba0e549-5587-3ef1-9082-99cd865de66f/pages/6548510e-c3e1-3099-be96-6edf02870699/content';

COMMENT ON FUNCTION public.fetch_sirene_data_by_siren(TEXT, TEXT) IS 
'Fonction interne pour récupérer les données Sirene avec gestion complète des erreurs.
Fait deux appels HTTP: un pour l''unité légale, un pour l''établissement siège (si disponible).
Utilise OAuth2 Bearer token pour l''authentification.';