-- =====================================================
-- Migration: Ajout de status_id dans la table leads
-- Date: 2025
-- Description: Migration progressive pour utiliser les statuts dynamiques
-- =====================================================

-- ÉTAPE 1: Ajouter la colonne status_id (nullable au début)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS status_id UUID;

-- ÉTAPE 2: Créer la foreign key vers lead_statuses
-- (On la crée nullable pour permettre le backfill progressif)
ALTER TABLE leads
ADD CONSTRAINT fk_leads_status 
FOREIGN KEY (status_id) 
REFERENCES lead_statuses(id) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- ÉTAPE 3: S'assurer qu'un statut par défaut existe
-- Si le statut avec code 'NOUVEAU' n'existe pas ou n'est pas marqué comme par défaut
-- Mettre à jour le statut par défaut (priorité à NOUVEAU car il a is_default=true et lead_count=23)
UPDATE lead_statuses
SET is_default = true
WHERE code = 'NOUVEAU'
AND NOT EXISTS (
  SELECT 1 FROM lead_statuses WHERE is_default = true
);

-- Si aucun statut par défaut n'existe, créer/mettre à jour NOUVEAU comme défaut
-- Note: La table lead_statuses existe déjà avec les données fournies

-- ÉTAPE 5: Backfill - Mapper les statuts texte existants vers status_id
-- Cette requête fait le mapping entre les valeurs texte de leads.statut
-- et les slugs de lead_statuses

-- D'abord, créons une fonction utilitaire pour normaliser les statuts texte
CREATE OR REPLACE FUNCTION normalize_lead_status(status_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Normaliser le texte : lowercase, trim, remplacer espaces par underscores
  RETURN LOWER(TRIM(REGEXP_REPLACE(COALESCE(status_text, ''), '\s+', '_', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mapper les statuts existants vers status_id
-- Stratégie: on fait correspondre les statuts texte aux codes avec normalisation intelligente
-- La table lead_statuses utilise 'code' (ex: 'NOUVEAU', 'nouveau_lead') 

-- Mapping intelligent: priorité aux codes en majuscules (NOUVEAU, QUALIFICATION, etc.)
-- car ils sont la structure principale (lead_count>0, pipeline_order défini)
UPDATE leads l
SET status_id = (
  SELECT ls.id
  FROM lead_statuses ls
  WHERE 
    -- Match direct par code (majuscules) - PRIORITÉ 1
    UPPER(TRIM(l.statut)) = UPPER(ls.code)
    OR
    -- Match par label exact (cas insensible) - PRIORITÉ 2
    LOWER(TRIM(l.statut)) = LOWER(TRIM(ls.label))
    OR
    -- Match normalisé par code/slug (snake_case) - PRIORITÉ 3
    normalize_lead_status(l.statut) = LOWER(COALESCE(ls.code, ls.slug))
  ORDER BY 
    -- Priorité 1: Codes en majuscules (structure principale avec lead_count)
    CASE 
      WHEN UPPER(TRIM(l.statut)) = UPPER(ls.code) AND ls.code ~ '^[A-Z_]+$' THEN 1
      WHEN LOWER(TRIM(l.statut)) = LOWER(TRIM(ls.label)) THEN 2
      ELSE 3
    END,
    -- Puis par ordre du pipeline (priorité aux statuts avec pipeline_order défini)
    COALESCE(ls.pipeline_order, ls.order_index, 999) ASC,
    -- En cas d'égalité, prioriser les statuts avec lead_count > 0 (actifs)
    (CASE WHEN (ls.lead_count IS NULL OR ls.lead_count = 0) THEN 1 ELSE 0 END)
  LIMIT 1
)
WHERE l.status_id IS NULL;

-- Pour les leads qui n'ont toujours pas de correspondance, utiliser le statut par défaut
UPDATE leads l
SET status_id = (
  SELECT id FROM lead_statuses 
  WHERE is_default = true 
  ORDER BY pipeline_order ASC NULLS LAST, order_index ASC NULLS LAST
  LIMIT 1
)
WHERE l.status_id IS NULL;

-- Si aucun statut par défaut n'existe, utiliser NOUVEAU (qui a lead_count=23, donc actif)
UPDATE leads l
SET status_id = (
  SELECT id FROM lead_statuses 
  WHERE code = 'NOUVEAU' 
  ORDER BY pipeline_order ASC
  LIMIT 1
)
WHERE l.status_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM lead_statuses WHERE is_default = true
);

-- ÉTAPE 6: Mettre à jour la colonne texte statut avec le label du statut
-- Pour maintenir la compatibilité, on synchronise statut (texte) avec status.label
UPDATE leads l
SET statut = (
  SELECT label FROM lead_statuses WHERE id = l.status_id
)
WHERE l.status_id IS NOT NULL;

-- ÉTAPE 6.5: Créer la table leads_events si elle n'existe pas (pour logger les changements de statut)
-- NOTE: user_id est stocké dans details JSONB, pas comme colonne séparée
CREATE TABLE IF NOT EXISTS leads_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour leads_events
CREATE INDEX IF NOT EXISTS idx_leads_events_lead_id ON leads_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_events_event_type ON leads_events(event_type);
CREATE INDEX IF NOT EXISTS idx_leads_events_created_at ON leads_events(created_at DESC);

-- ÉTAPE 7: Créer un index sur status_id pour les performances
CREATE INDEX IF NOT EXISTS idx_leads_status_id ON leads(status_id);

-- ÉTAPE 8: Créer un trigger pour synchroniser automatiquement statut (texte) avec status.label
-- Ce trigger maintient la colonne texte synchronisée quand status_id change
CREATE OR REPLACE FUNCTION sync_lead_status_text()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status_id IS NOT NULL THEN
    NEW.statut := (
      SELECT label 
      FROM lead_statuses 
      WHERE id = NEW.status_id
      LIMIT 1
    );
  ELSIF NEW.status_id IS NULL THEN
    NEW.statut := (
      SELECT label 
      FROM lead_statuses 
      WHERE is_default = true 
      ORDER BY COALESCE(pipeline_order, order_index, 999) ASC
      LIMIT 1
    );
    
    -- Si aucun statut par défaut, utiliser NOUVEAU
    IF NEW.statut IS NULL THEN
      NEW.statut := (
        SELECT label 
        FROM lead_statuses 
        WHERE code = 'NOUVEAU' 
        ORDER BY COALESCE(pipeline_order, order_index, 999) ASC
        LIMIT 1
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_sync_lead_status_text ON leads;

-- Créer le trigger BEFORE INSERT OR UPDATE
CREATE TRIGGER trigger_sync_lead_status_text
BEFORE INSERT OR UPDATE OF status_id ON leads
FOR EACH ROW
EXECUTE FUNCTION sync_lead_status_text();

-- ÉTAPE 9: Optionnel - Une fois que tout fonctionne bien, on peut rendre status_id NOT NULL
-- ATTENTION: À faire uniquement après avoir vérifié que tous les leads ont un status_id
-- Décommenter cette ligne une fois la migration validée :
-- ALTER TABLE leads ALTER COLUMN status_id SET NOT NULL;

-- =====================================================
-- Vérifications post-migration
-- =====================================================

-- Vérifier que tous les leads ont un status_id
SELECT 
  COUNT(*) as total_leads,
  COUNT(status_id) as leads_with_status_id,
  COUNT(*) - COUNT(status_id) as leads_missing_status_id
FROM leads;

-- Vérifier la distribution des statuts
SELECT 
  ls.label,
  COALESCE(ls.code, ls.slug) as code_slug,
  COUNT(l.id) as lead_count
FROM lead_statuses ls
LEFT JOIN leads l ON l.status_id = ls.id
GROUP BY ls.id, ls.label, COALESCE(ls.code, ls.slug)
ORDER BY COALESCE(ls.pipeline_order, ls.order_index, 999);

-- =====================================================
-- Notes importantes:
-- =====================================================
-- 1. La colonne texte 'statut' est conservée pour compatibilité
-- 2. Le trigger maintient automatiquement la synchronisation
-- 3. On peut rendre status_id NOT NULL une fois la migration validée
-- 4. Pour supprimer l'ancienne colonne 'statut' dans le futur:
--    ALTER TABLE leads DROP COLUMN statut;
-- 5. Ne pas oublier de mettre à jour les index et les policies RLS si nécessaire

