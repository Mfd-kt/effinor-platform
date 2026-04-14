-- Script SQL pour ajouter les colonnes CEE à la table commandes
-- Exécutez ce script dans Supabase SQL Editor

-- Section 1: Siège Social
ALTER TABLE commandes 
  ADD COLUMN IF NOT EXISTS adresse_siege TEXT,
  ADD COLUMN IF NOT EXISTS ville_siege TEXT,
  ADD COLUMN IF NOT EXISTS code_postal_siege TEXT,
  ADD COLUMN IF NOT EXISTS numero_siret TEXT,
  ADD COLUMN IF NOT EXISTS siren TEXT;

-- Section 2: Adresse des Travaux
ALTER TABLE commandes 
  ADD COLUMN IF NOT EXISTS adresse_travaux TEXT,
  ADD COLUMN IF NOT EXISTS ville_travaux TEXT,
  ADD COLUMN IF NOT EXISTS code_postal_travaux TEXT,
  ADD COLUMN IF NOT EXISTS siret_site_travaux TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS zone_climatique TEXT;

-- Section 3: Bénéficiaire de Travaux
ALTER TABLE commandes 
  ADD COLUMN IF NOT EXISTS raison_sociale_beneficiaire TEXT,
  ADD COLUMN IF NOT EXISTS telephone_fixe_beneficiaire TEXT,
  ADD COLUMN IF NOT EXISTS email_beneficiaire TEXT,
  ADD COLUMN IF NOT EXISTS civilite_responsable TEXT,
  ADD COLUMN IF NOT EXISTS nom_responsable TEXT,
  ADD COLUMN IF NOT EXISTS prenom_responsable TEXT,
  ADD COLUMN IF NOT EXISTS telephone_responsable TEXT;

-- Section 4: Détails des Travaux
ALTER TABLE commandes 
  ADD COLUMN IF NOT EXISTS categories_travaux JSONB,
  ADD COLUMN IF NOT EXISTS parcelle_cadastrale TEXT,
  ADD COLUMN IF NOT EXISTS qualification TEXT,
  ADD COLUMN IF NOT EXISTS surface_m2 TEXT,
  ADD COLUMN IF NOT EXISTS certificat_preparatoire TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN commandes.adresse_siege IS 'Adresse du siège social';
COMMENT ON COLUMN commandes.ville_siege IS 'Ville du siège social';
COMMENT ON COLUMN commandes.code_postal_siege IS 'Code postal du siège social';
COMMENT ON COLUMN commandes.numero_siret IS 'SIRET (14 chiffres) du siège social';
COMMENT ON COLUMN commandes.siren IS 'SIREN (9 chiffres) du siège social';
COMMENT ON COLUMN commandes.adresse_travaux IS 'Adresse où les travaux seront effectués';
COMMENT ON COLUMN commandes.ville_travaux IS 'Ville où les travaux seront effectués';
COMMENT ON COLUMN commandes.code_postal_travaux IS 'Code postal où les travaux seront effectués';
COMMENT ON COLUMN commandes.siret_site_travaux IS 'SIRET du site de travaux (14 chiffres)';
COMMENT ON COLUMN commandes.region IS 'Région française (ex: Île-de-France)';
COMMENT ON COLUMN commandes.zone_climatique IS 'Zone climatique (H1, H2, H3)';
COMMENT ON COLUMN commandes.raison_sociale_beneficiaire IS 'Raison sociale du bénéficiaire des travaux';
COMMENT ON COLUMN commandes.telephone_fixe_beneficiaire IS 'Téléphone fixe du bénéficiaire';
COMMENT ON COLUMN commandes.email_beneficiaire IS 'Email du bénéficiaire des travaux';
COMMENT ON COLUMN commandes.civilite_responsable IS 'Civilité du responsable (Mr, Mme, Mlle)';
COMMENT ON COLUMN commandes.nom_responsable IS 'Nom du responsable';
COMMENT ON COLUMN commandes.prenom_responsable IS 'Prénom du responsable';
COMMENT ON COLUMN commandes.telephone_responsable IS 'Téléphone du responsable';
COMMENT ON COLUMN commandes.categories_travaux IS 'Catégories de travaux (JSON array)';
COMMENT ON COLUMN commandes.parcelle_cadastrale IS 'Numéro de parcelle cadastrale';
COMMENT ON COLUMN commandes.qualification IS 'Qualification des travaux (ex: 3 étoiles)';
COMMENT ON COLUMN commandes.surface_m2 IS 'Surface en m²';
COMMENT ON COLUMN commandes.certificat_preparatoire IS 'Chemin du fichier certificat préparatoire dans Supabase Storage';

-- Vérification: Afficher les colonnes ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commandes'
  AND column_name IN (
    'adresse_siege', 'ville_siege', 'code_postal_siege', 'numero_siret', 'siren',
    'adresse_travaux', 'ville_travaux', 'code_postal_travaux', 'siret_site_travaux', 'region', 'zone_climatique',
    'raison_sociale_beneficiaire', 'telephone_fixe_beneficiaire', 'email_beneficiaire', 'civilite_responsable',
    'nom_responsable', 'prenom_responsable', 'telephone_responsable',
    'categories_travaux', 'parcelle_cadastrale', 'qualification', 'surface_m2', 'certificat_preparatoire'
  )
ORDER BY column_name;

