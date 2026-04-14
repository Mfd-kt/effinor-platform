-- Migration: Auto-update région et zone climatique depuis code_postal_travaux
-- Date: 2025-01-10
-- Description: Crée un trigger pour calculer automatiquement la région et la zone climatique
--              quand le code_postal_travaux est modifié

-- ============================================
-- FONCTION POUR CALCULER LA ZONE CLIMATIQUE
-- ============================================

-- Fonction exacte fournie par l'utilisateur
CREATE OR REPLACE FUNCTION public.compute_zone_climatique_from_cp_travaux(cp_text TEXT)
RETURNS TEXT AS $$
DECLARE
  cp_clean TEXT;
  dept TEXT;
BEGIN
  cp_clean := public.normalize_cp_travaux(cp_text);

  IF cp_clean IS NULL THEN
    RETURN NULL; -- ou 'Zone inconnue'
  END IF;

  -- DOM/TOM: 97x / 98x -> on prend 3 chiffres, sinon 2
  IF substring(cp_clean,1,2) IN ('97','98') THEN
    dept := substring(cp_clean,1,3);
  ELSE
    dept := substring(cp_clean,1,2);
  END IF;

  -- H1
  IF dept IN (
    '01','02','03','05','08','10','14','15','19','21','23','25','27','28',
    '38','39','42','43','45','51','52','54','55','57','58','59','60','61',
    '62','63','67','68','69','70','71','73','74','75','76','77','78','80',
    '87','88','89','90','91','92','93','94','95','975'
  ) THEN
    RETURN 'H1';
  END IF;

  -- H2
  IF dept IN (
    '04','07','09','12','16','17','18','22','24','26','29','31','32','33',
    '35','36','37','40','41','44','46','47','48','49','50','53','56','64',
    '65','72','79','81','82','84','85','86'
  ) THEN
    RETURN 'H2';
  END IF;

  -- H3
  IF dept IN (
    '06','11','13','20','30','34','66','83','971','972','973','974','976'
  ) THEN
    RETURN 'H3';
  END IF;

  RETURN 'Zone inconnue';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FONCTION POUR CALCULER LA RÉGION
-- ============================================

CREATE OR REPLACE FUNCTION public.compute_region_from_cp_travaux(cp_text TEXT)
RETURNS TEXT AS $$
DECLARE
  cp_clean TEXT;
  dept TEXT;
BEGIN
  -- Utiliser la fonction de normalisation si elle existe, sinon utiliser directement
  BEGIN
    cp_clean := public.normalize_cp_travaux(cp_text);
  EXCEPTION WHEN OTHERS THEN
    -- Si la fonction n'existe pas ou erreur, utiliser le code postal tel quel
    cp_clean := regexp_replace(cp_text, '[^0-9]', '', 'g');
  END;

  IF cp_clean IS NULL OR length(cp_clean) < 2 THEN
    RETURN NULL;
  END IF;

  -- DOM/TOM: 97x / 98x -> on prend 3 chiffres, sinon 2
  IF substring(cp_clean, 1, 2) IN ('97', '98') THEN
    dept := substring(cp_clean, 1, 3);
  ELSE
    dept := substring(cp_clean, 1, 2);
  END IF;

  -- Mapping des départements aux régions françaises (depuis 2016)
  -- Île-de-France
  IF dept IN ('75', '77', '78', '91', '92', '93', '94', '95') THEN
    RETURN 'Île-de-France';
  END IF;

  -- Centre-Val de Loire
  IF dept IN ('18', '28', '36', '37', '41', '45') THEN
    RETURN 'Centre-Val de Loire';
  END IF;

  -- Bourgogne-Franche-Comté
  IF dept IN ('21', '25', '39', '58', '70', '71', '89', '90') THEN
    RETURN 'Bourgogne-Franche-Comté';
  END IF;

  -- Normandie
  IF dept IN ('14', '27', '50', '61', '76') THEN
    RETURN 'Normandie';
  END IF;

  -- Hauts-de-France
  IF dept IN ('02', '59', '60', '62', '80') THEN
    RETURN 'Hauts-de-France';
  END IF;

  -- Grand Est
  IF dept IN ('08', '10', '51', '52', '54', '55', '57', '67', '68', '88') THEN
    RETURN 'Grand Est';
  END IF;

  -- Bretagne
  IF dept IN ('22', '29', '35', '56') THEN
    RETURN 'Bretagne';
  END IF;

  -- Pays de la Loire
  IF dept IN ('44', '49', '53', '72', '85') THEN
    RETURN 'Pays de la Loire';
  END IF;

  -- Nouvelle-Aquitaine
  IF dept IN ('16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87') THEN
    RETURN 'Nouvelle-Aquitaine';
  END IF;

  -- Occitanie
  IF dept IN ('09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82') THEN
    RETURN 'Occitanie';
  END IF;

  -- Auvergne-Rhône-Alpes
  IF dept IN ('01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74') THEN
    RETURN 'Auvergne-Rhône-Alpes';
  END IF;

  -- Provence-Alpes-Côte d'Azur
  IF dept IN ('04', '05', '06', '13', '83', '84') THEN
    RETURN 'Provence-Alpes-Côte d''Azur';
  END IF;

  -- Corse (2A, 2B)
  IF substring(cp_clean, 1, 2) = '20' AND cp_clean >= '20000' AND cp_clean <= '20999' THEN
    RETURN 'Corse';
  END IF;

  -- Outre-Mer
  IF dept IN ('971') THEN RETURN 'Guadeloupe'; END IF;
  IF dept IN ('972') THEN RETURN 'Martinique'; END IF;
  IF dept IN ('973') THEN RETURN 'Guyane'; END IF;
  IF dept IN ('974') THEN RETURN 'La Réunion'; END IF;
  IF dept IN ('976') THEN RETURN 'Mayotte'; END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- FONCTION TRIGGER POUR METTRE À JOUR AUTOMATIQUEMENT
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_update_region_zone_climatique_from_cp_travaux()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour seulement si code_postal_travaux a changé ou si region/zone_climatique sont vides
  IF (NEW.code_postal_travaux IS DISTINCT FROM OLD.code_postal_travaux) 
     OR (NEW.region IS NULL AND NEW.code_postal_travaux IS NOT NULL)
     OR (NEW.zone_climatique IS NULL AND NEW.code_postal_travaux IS NOT NULL) THEN
    
    -- Calculer et mettre à jour la région
    IF NEW.code_postal_travaux IS NOT NULL AND length(trim(NEW.code_postal_travaux)) >= 2 THEN
      NEW.region := public.compute_region_from_cp_travaux(NEW.code_postal_travaux);
      NEW.zone_climatique := public.compute_zone_climatique_from_cp_travaux(NEW.code_postal_travaux);
    ELSE
      -- Si le code postal est vide, vider aussi région et zone climatique
      NEW.region := NULL;
      NEW.zone_climatique := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CRÉER LE TRIGGER
-- ============================================

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_auto_update_region_zone_climatique ON public.leads;

-- Créer le trigger BEFORE INSERT OR UPDATE
CREATE TRIGGER trigger_auto_update_region_zone_climatique
BEFORE INSERT OR UPDATE OF code_postal_travaux ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_region_zone_climatique_from_cp_travaux();

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION public.compute_region_from_cp_travaux(TEXT) IS 'Calcule la région française à partir du code postal des travaux';
COMMENT ON FUNCTION public.compute_zone_climatique_from_cp_travaux(TEXT) IS 'Calcule la zone climatique (H1/H2/H3) à partir du code postal des travaux';
COMMENT ON FUNCTION public.auto_update_region_zone_climatique_from_cp_travaux() IS 'Trigger function pour mettre à jour automatiquement région et zone_climatique quand code_postal_travaux change';

-- ============================================
-- MISE À JOUR DES DONNÉES EXISTANTES (Optionnel)
-- ============================================

-- Décommenter pour mettre à jour tous les leads existants qui ont un code_postal_travaux mais pas de région/zone_climatique
/*
UPDATE public.leads
SET
  region = public.compute_region_from_cp_travaux(code_postal_travaux),
  zone_climatique = public.compute_zone_climatique_from_cp_travaux(code_postal_travaux)
WHERE code_postal_travaux IS NOT NULL
  AND (region IS NULL OR zone_climatique IS NULL);
*/

