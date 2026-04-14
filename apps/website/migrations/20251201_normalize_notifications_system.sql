-- Migration: Normalisation complète du système de notifications
-- Date: 2025-12-01
-- Description: Refactorise la table notifications avec schéma propre, RLS, et triggers optimisés
-- 
-- Cette migration :
-- 1. Normalise le schéma de la table notifications
-- 2. Migre les données existantes
-- 3. Crée les RLS policies
-- 4. Refactorise les triggers (lead_created, lead_assigned, order_created)

-- ============================================================================
-- ÉTAPE 1: Sauvegarder les données existantes (si table existe déjà)
-- ============================================================================

DO $$
BEGIN
  -- Si la table existe déjà, créer une table temporaire pour sauvegarder
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    CREATE TEMP TABLE IF NOT EXISTS notifications_backup AS
    SELECT * FROM public.notifications;
    
    RAISE NOTICE 'Données existantes sauvegardées dans notifications_backup';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 2: Supprimer les anciens triggers et fonctions
-- ============================================================================

DROP TRIGGER IF EXISTS trg_notify_new_lead ON public.leads;
DROP TRIGGER IF EXISTS trg_notify_new_commande ON public.commandes;
DROP FUNCTION IF EXISTS public.notify_new_lead();
DROP FUNCTION IF EXISTS public.notify_new_commande();

-- ============================================================================
-- ÉTAPE 3: Supprimer les anciennes policies RLS (si elles existent)
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', policy_record.policyname);
  END LOOP;
END $$;

-- ============================================================================
-- ÉTAPE 4: Recréer la table notifications avec le schéma normalisé
-- ============================================================================

-- Supprimer la table si elle existe (on la recrée proprement)
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                TEXT NOT NULL CHECK (type IN ('lead_created', 'lead_assigned', 'order_created', 'system')),
  title               TEXT NOT NULL,
  message             TEXT,
  entity_type         TEXT CHECK (entity_type IN ('lead', 'order', 'system')),
  entity_id           UUID,
  recipient_user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role      TEXT CHECK (recipient_role IN ('admin', 'manager', 'commercial', 'technicien', 'viewer')),
  status              TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at             TIMESTAMPTZ,
  
  -- Contraintes logiques
  CONSTRAINT notifications_recipient_check CHECK (
    (recipient_user_id IS NOT NULL) OR (recipient_role IS NOT NULL) OR (recipient_user_id IS NULL AND recipient_role IS NULL)
  )
);

-- ============================================================================
-- ÉTAPE 5: Restaurer les données existantes (si backup existe)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'pg_temp' AND tablename = 'notifications_backup') THEN
    -- Migrer les anciennes données vers le nouveau schéma
    INSERT INTO public.notifications (
      id, type, title, message, entity_id, recipient_user_id, status, created_at, read_at, entity_type
    )
    SELECT 
      id,
      CASE 
        WHEN type = 'lead' THEN 'lead_created'
        WHEN type = 'commande' THEN 'order_created'
        ELSE 'system'
      END as type,
      title,
      message,
      entity_id,
      user_id as recipient_user_id,  -- Ancien user_id → nouveau recipient_user_id
      status,
      created_at,
      read_at,
      CASE 
        WHEN type = 'lead' THEN 'lead'
        WHEN type = 'commande' THEN 'order'
        ELSE 'system'
      END as entity_type
    FROM pg_temp.notifications_backup;
    
    RAISE NOTICE 'Données migrées depuis notifications_backup';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 6: Créer les index pour les performances
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON public.notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_status 
  ON public.notifications (status);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON public.notifications (type);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id 
  ON public.notifications (recipient_user_id) 
  WHERE recipient_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role 
  ON public.notifications (recipient_role) 
  WHERE recipient_role IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_entity 
  ON public.notifications (entity_type, entity_id) 
  WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_status 
  ON public.notifications (recipient_user_id, status, created_at DESC) 
  WHERE recipient_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role_status 
  ON public.notifications (recipient_role, status, created_at DESC) 
  WHERE recipient_role IS NOT NULL;

-- ============================================================================
-- ÉTAPE 7: Activer RLS
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 8: Créer les RLS Policies
-- ============================================================================

-- Policy 1: Admin voit toutes les notifications
CREATE POLICY "admin_all_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role = 'admin'
  )
);

-- Policy 2: Manager voit toutes les notifications (si rôle existe)
CREATE POLICY "manager_all_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role = 'manager'
  )
);

-- Policy 3: Super Admin voit toutes les notifications
CREATE POLICY "super_admin_all_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role = 'super_admin'
  )
);

-- Policy 4: Utilisateur voit ses propres notifications + globales (sans recipient)
CREATE POLICY "user_own_notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR (recipient_user_id IS NULL AND recipient_role IS NULL)
  OR (
    recipient_role IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.utilisateurs
      WHERE utilisateurs.auth_user_id = auth.uid()
      AND utilisateurs.role = recipient_role
    )
  )
);

-- Policy 5: Permettre l'insertion via triggers (SECURITY DEFINER)
-- Les triggers utilisent SECURITY DEFINER donc ils peuvent insérer
-- Mais on peut aussi permettre aux admins d'insérer manuellement
CREATE POLICY "admin_insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role IN ('admin', 'super_admin')
  )
);

-- Policy 6: Permettre la mise à jour (marquer comme lu)
CREATE POLICY "user_update_own_notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role IN ('admin', 'super_admin', 'manager')
  )
)
WITH CHECK (
  recipient_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role IN ('admin', 'super_admin', 'manager')
  )
);

-- ============================================================================
-- ÉTAPE 9: Fonction trigger pour notifier la création d'un lead
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_lead_created()
RETURNS TRIGGER AS $$
DECLARE
  nom_complet TEXT;
  societe_text TEXT;
  title_text TEXT;
  message_text TEXT;
BEGIN
  -- Construire le nom complet
  IF NEW.prenom IS NOT NULL AND NEW.nom IS NOT NULL THEN
    nom_complet := NEW.prenom || ' ' || NEW.nom;
  ELSIF NEW.nom IS NOT NULL THEN
    nom_complet := NEW.nom;
  ELSE
    nom_complet := 'Sans nom';
  END IF;
  
  -- Récupérer la société
  societe_text := COALESCE(NEW.societe, '');
  
  -- Construire le titre
  IF societe_text != '' THEN
    title_text := 'Nouveau lead : ' || nom_complet || ' (' || societe_text || ')';
  ELSE
    title_text := 'Nouveau lead : ' || nom_complet;
  END IF;
  
  -- Construire le message
  message_text := 'Lead créé depuis ' || COALESCE(NEW.source, 'source inconnue');
  IF NEW.email IS NOT NULL THEN
    message_text := message_text || ' • ' || NEW.email;
  ELSIF NEW.telephone IS NOT NULL THEN
    message_text := message_text || ' • ' || NEW.telephone;
  END IF;
  
  -- Insérer une notification globale pour admin/manager
  INSERT INTO public.notifications (
    type, 
    title, 
    message, 
    entity_type, 
    entity_id, 
    recipient_role
  )
  VALUES (
    'lead_created',
    title_text,
    message_text,
    'lead',
    NEW.id,
    'admin'  -- Notification pour les admins
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 10: Fonction trigger pour notifier l'assignation d'un lead
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_lead_assigned()
RETURNS TRIGGER AS $$
DECLARE
  nom_complet TEXT;
  societe_text TEXT;
  title_text TEXT;
  message_text TEXT;
  assigned_user_id UUID;
BEGIN
  -- Vérifier si le commercial assigné a changé
  -- On utilise commercial_assigne_id en priorité, sinon responsable_id
  assigned_user_id := COALESCE(NEW.commercial_assigne_id, NEW.responsable_id);
  
  -- Ne créer une notification que si :
  -- 1. Un commercial est assigné
  -- 2. L'assignation a changé (nouveau lead ou réassignation)
  IF assigned_user_id IS NOT NULL 
     AND (OLD.commercial_assigne_id IS DISTINCT FROM NEW.commercial_assigne_id 
          OR OLD.responsable_id IS DISTINCT FROM NEW.responsable_id) THEN
    
    -- Construire le nom complet
    IF NEW.prenom IS NOT NULL AND NEW.nom IS NOT NULL THEN
      nom_complet := NEW.prenom || ' ' || NEW.nom;
    ELSIF NEW.nom IS NOT NULL THEN
      nom_complet := NEW.nom;
    ELSE
      nom_complet := 'Sans nom';
    END IF;
    
    societe_text := COALESCE(NEW.societe, '');
    
    -- Construire le titre
    IF societe_text != '' THEN
      title_text := 'Lead assigné : ' || nom_complet || ' (' || societe_text || ')';
    ELSE
      title_text := 'Lead assigné : ' || nom_complet;
    END IF;
    
    message_text := 'Un nouveau lead vous a été assigné';
    IF NEW.email IS NOT NULL THEN
      message_text := message_text || ' • ' || NEW.email;
    END IF;
    
    -- Insérer une notification pour le commercial assigné
    INSERT INTO public.notifications (
      type,
      title,
      message,
      entity_type,
      entity_id,
      recipient_user_id,
      recipient_role
    )
    VALUES (
      'lead_assigned',
      title_text,
      message_text,
      'lead',
      NEW.id,
      assigned_user_id,
      'commercial'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 11: Fonction trigger pour notifier la création d'une commande
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_order_created()
RETURNS TRIGGER AS $$
DECLARE
  reference_text TEXT;
  client_nom_text TEXT;
  total_text TEXT;
  title_text TEXT;
  message_text TEXT;
BEGIN
  -- Récupérer la référence
  reference_text := COALESCE(NEW.reference, 'CMD-' || SUBSTRING(NEW.id::TEXT, 1, 8));
  
  -- Récupérer le nom du client
  client_nom_text := COALESCE(NEW.nom_client, 'Client inconnu');
  
  -- Construire le titre
  title_text := 'Nouvelle commande : ' || reference_text;
  
  -- Construire le message avec montant
  IF NEW.total_ttc IS NOT NULL AND NEW.total_ttc > 0 THEN
    total_text := TO_CHAR(NEW.total_ttc, 'FM999 999 999.00') || ' € TTC';
  ELSIF NEW.total_ht IS NOT NULL AND NEW.total_ht > 0 THEN
    total_text := TO_CHAR(NEW.total_ht, 'FM999 999 999.00') || ' € HT';
  ELSE
    total_text := 'Montant non renseigné';
  END IF;
  
  message_text := client_nom_text || ' • ' || total_text;
  
  -- Insérer une notification globale pour admin/manager
  INSERT INTO public.notifications (
    type,
    title,
    message,
    entity_type,
    entity_id,
    recipient_role
  )
  VALUES (
    'order_created',
    title_text,
    message_text,
    'order',
    NEW.id,
    'admin'  -- Notification pour les admins
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 12: Créer les triggers
-- ============================================================================

-- Trigger pour création de lead
CREATE TRIGGER trg_notify_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_created();

-- Trigger pour assignation de lead (INSERT ou UPDATE)
CREATE TRIGGER trg_notify_lead_assigned
  AFTER INSERT OR UPDATE OF commercial_assigne_id, responsable_id ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_assigned();

-- Trigger pour création de commande
CREATE TRIGGER trg_notify_order_created
  AFTER INSERT ON public.commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_created();

-- ============================================================================
-- ÉTAPE 13: Commentaires pour documentation
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'Table centrale pour toutes les notifications de l''admin (leads, commandes, système)';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification: lead_created, lead_assigned, order_created, system';
COMMENT ON COLUMN public.notifications.entity_type IS 'Type d''entité liée: lead, order, system';
COMMENT ON COLUMN public.notifications.entity_id IS 'ID de l''entité liée (lead.id ou commande.id)';
COMMENT ON COLUMN public.notifications.recipient_user_id IS 'ID utilisateur destinataire (nullable pour notifications globales)';
COMMENT ON COLUMN public.notifications.recipient_role IS 'Rôle destinataire (nullable, pour notifications par rôle)';
COMMENT ON COLUMN public.notifications.status IS 'Statut: unread (non lue) ou read (lue)';

COMMENT ON FUNCTION public.notify_lead_created() IS 'Fonction trigger pour créer automatiquement une notification lors de la création d''un lead (destinée aux admins)';
COMMENT ON FUNCTION public.notify_lead_assigned() IS 'Fonction trigger pour créer automatiquement une notification lors de l''assignation d''un lead à un commercial';
COMMENT ON FUNCTION public.notify_order_created() IS 'Fonction trigger pour créer automatiquement une notification lors de la création d''une commande (destinée aux admins)';

-- ============================================================================
-- ÉTAPE 14: Activer Realtime (nécessite d'être fait dans Supabase Dashboard)
-- ============================================================================

-- Aller dans Database > Replication et activer la réplication pour la table 'notifications'
-- Cette étape doit être faite manuellement dans le dashboard Supabase



















