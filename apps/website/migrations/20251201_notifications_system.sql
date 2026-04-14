DO $$
BEGIN
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
DROP TRIGGER IF EXISTS trg_notify_lead_created ON public.leads;
DROP TRIGGER IF EXISTS trg_notify_lead_assigned ON public.leads;
DROP TRIGGER IF EXISTS trg_notify_new_commande ON public.commandes;
DROP TRIGGER IF EXISTS trg_notify_order_created ON public.commandes;
DROP TRIGGER IF EXISTS trg_notify_order_assigned ON public.commandes;

DROP FUNCTION IF EXISTS public.notify_new_lead();
DROP FUNCTION IF EXISTS public.notify_lead_created();
DROP FUNCTION IF EXISTS public.notify_lead_assigned();
DROP FUNCTION IF EXISTS public.notify_new_commande();
DROP FUNCTION IF EXISTS public.notify_order_created();
DROP FUNCTION IF EXISTS public.notify_order_assigned();

-- ============================================================================
-- ÉTAPE 3: Supprimer toutes les anciennes policies RLS
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
-- ÉTAPE 4: Créer/Modifier la table notifications avec le schéma cible
-- ============================================================================

-- Supprimer la table si elle existe (on la recrée proprement)
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL CHECK (type IN ('lead_created', 'lead_assigned', 'order_created', 'order_assigned', 'system')),
  title             TEXT NOT NULL,
  message           TEXT NOT NULL,
  entity_type       TEXT CHECK (entity_type IN ('lead', 'order', 'system')) DEFAULT 'system',
  entity_id         UUID NULL,
  recipient_user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role    TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  read_at           TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Contrainte logique : au moins un destinataire doit être défini (ou notification globale)
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
      id, type, title, message, entity_type, entity_id, 
      recipient_user_id, recipient_role, status, created_at, read_at, meta
    )
    SELECT 
      id,
      CASE 
        WHEN type = 'lead' THEN 'lead_created'
        WHEN type = 'commande' THEN 'order_created'
        ELSE 'system'
      END as type,
      title,
      COALESCE(message, '') as message,
      CASE 
        WHEN type = 'lead' THEN 'lead'
        WHEN type = 'commande' THEN 'order'
        ELSE 'system'
      END as entity_type,
      entity_id,
      user_id as recipient_user_id,  -- Ancien user_id → nouveau recipient_user_id
      NULL as recipient_role,  -- Pas de rôle dans l'ancien schéma
      status,
      created_at,
      read_at,
      '{}'::jsonb as meta
    FROM pg_temp.notifications_backup
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications n WHERE n.id = notifications_backup.id
    );
    
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

-- Index composites pour requêtes fréquentes
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
DROP POLICY IF EXISTS admin_all_notifications ON public.notifications;
CREATE POLICY admin_all_notifications
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

-- Policy 2: Manager voit toutes les notifications
DROP POLICY IF EXISTS manager_all_notifications ON public.notifications;
CREATE POLICY manager_all_notifications
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
DROP POLICY IF EXISTS super_admin_all_notifications ON public.notifications;
CREATE POLICY super_admin_all_notifications
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

-- Policy 4: Utilisateur voit ses propres notifications + globales + celles de son rôle
DROP POLICY IF EXISTS user_notifications ON public.notifications;
CREATE POLICY user_notifications
ON public.notifications
FOR SELECT
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR (
    recipient_role IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.utilisateurs
      WHERE utilisateurs.auth_user_id = auth.uid()
      AND utilisateurs.role = recipient_role
    )
  )
  OR (recipient_user_id IS NULL AND recipient_role IS NULL)  -- notification globale
);

-- Policy 5: Utilisateur peut mettre à jour ses propres notifications (marquer comme lu)
DROP POLICY IF EXISTS user_update_notifications ON public.notifications;
CREATE POLICY user_update_notifications
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

-- Policy 6: Insertion réservée au service_role / triggers (pas depuis le client React)
-- Les triggers utilisent SECURITY DEFINER donc ils peuvent insérer
-- On permet aussi aux admins d'insérer manuellement si besoin
DROP POLICY IF EXISTS service_insert_notifications ON public.notifications;
CREATE POLICY service_insert_notifications
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

-- ============================================================================
-- ÉTAPE 9: Fonction trigger pour notifier la création d'un lead
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_lead_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  nom_complet TEXT;
  societe_text TEXT;
  title_text TEXT;
  message_text TEXT;
BEGIN
  -- Construire le nom complet à partir de prenom + nom
  IF NEW.prenom IS NOT NULL AND NEW.nom IS NOT NULL THEN
    nom_complet := TRIM(NEW.prenom || ' ' || NEW.nom);
  ELSIF NEW.nom IS NOT NULL THEN
    nom_complet := NEW.nom;
  ELSIF NEW.prenom IS NOT NULL THEN
    nom_complet := NEW.prenom;
  ELSE
    nom_complet := 'Sans nom';
  END IF;
  
  societe_text := COALESCE(NEW.societe, '');
  
  -- Construire le titre
  IF societe_text != '' THEN
    title_text := 'Nouveau lead : ' || nom_complet || ' (' || societe_text || ')';
  ELSE
    title_text := 'Nouveau lead : ' || nom_complet;
  END IF;
  
  -- Construire le message
  message_text := 'Un nouveau lead vient d''être créé';
  IF NEW.source IS NOT NULL THEN
    message_text := message_text || ' depuis ' || NEW.source;
  END IF;
  IF NEW.email IS NOT NULL THEN
    message_text := message_text || ' • ' || NEW.email;
  ELSIF NEW.telephone IS NOT NULL THEN
    message_text := message_text || ' • ' || NEW.telephone;
  END IF;
  
  -- Insérer une notification globale pour manager/admin
  INSERT INTO public.notifications (
    type, 
    title, 
    message, 
    entity_type, 
    entity_id, 
    recipient_role,
    meta
  )
  VALUES (
    'lead_created',
    title_text,
    message_text,
    'lead',
    NEW.id,
    'manager',  -- Notification pour les managers (Vadim)
    jsonb_build_object(
      'lead_id', NEW.id,
      'nom', nom_complet,
      'societe', societe_text,
      'source', COALESCE(NEW.source, ''),
      'email', NEW.email,
      'telephone', NEW.telephone
    )
  );
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ÉTAPE 10: Fonction trigger pour notifier l'assignation d'un lead
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_lead_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_commercial UUID;
  v_new_commercial UUID;
  nom_complet TEXT;
  societe_text TEXT;
  title_text TEXT;
  message_text TEXT;
BEGIN
  -- Détecter le commercial assigné (priorité à commercial_assigne_id, sinon responsable_id)
  v_old_commercial := COALESCE(OLD.commercial_assigne_id, OLD.responsable_id);
  v_new_commercial := COALESCE(NEW.commercial_assigne_id, NEW.responsable_id);
  
  -- Ne créer une notification que si le commercial a changé
  IF COALESCE(v_old_commercial, '00000000-0000-0000-0000-000000000000'::uuid)
     = COALESCE(v_new_commercial, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RETURN NEW;
  END IF;
  
  -- Si un commercial est assigné, créer la notification
  IF v_new_commercial IS NOT NULL THEN
    -- Construire le nom complet
    IF NEW.prenom IS NOT NULL AND NEW.nom IS NOT NULL THEN
      nom_complet := TRIM(NEW.prenom || ' ' || NEW.nom);
    ELSIF NEW.nom IS NOT NULL THEN
      nom_complet := NEW.nom;
    ELSIF NEW.prenom IS NOT NULL THEN
      nom_complet := NEW.prenom;
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
    
    message_text := 'Un lead vient de vous être assigné';
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
      recipient_role,
      meta
    )
    VALUES (
      'lead_assigned',
      title_text,
      message_text,
      'lead',
      NEW.id,
      v_new_commercial,
      'commercial',  -- Rôle du destinataire
      jsonb_build_object(
        'lead_id', NEW.id,
        'nom', nom_complet,
        'societe', societe_text,
        'email', NEW.email,
        'telephone', NEW.telephone
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ÉTAPE 11: Fonction trigger pour notifier la création d'une commande
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  
  message_text := 'Une nouvelle commande vient d''être créée : ' || client_nom_text || ' • ' || total_text;
  
  -- Insérer une notification globale pour manager/admin
  INSERT INTO public.notifications (
    type,
    title,
    message,
    entity_type,
    entity_id,
    recipient_role,
    meta
  )
  VALUES (
    'order_created',
    title_text,
    message_text,
    'order',
    NEW.id,
    'manager',  -- Notification pour les managers
    jsonb_build_object(
      'order_id', NEW.id,
      'reference', reference_text,
      'client_nom', client_nom_text,
      'total_ttc', NEW.total_ttc,
      'total_ht', NEW.total_ht,
      'paiement_statut', COALESCE(NEW.paiement_statut, '')
    )
  );
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ÉTAPE 12: Fonction trigger pour notifier l'assignation d'une commande (si applicable)
-- ============================================================================

-- Note: Cette fonction est préparée pour le futur si vous ajoutez une colonne 
-- commercial_assigne_id ou responsable_id dans la table commandes
-- Pour l'instant, elle n'est pas utilisée car commandes n'a pas de colonne d'assignation

CREATE OR REPLACE FUNCTION public.notify_order_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_commercial UUID;
  v_new_commercial UUID;
  reference_text TEXT;
  title_text TEXT;
  message_text TEXT;
BEGIN
  -- Détecter le commercial assigné (si colonne existe)
  -- Pour l'instant, on vérifie si la colonne existe avant de l'utiliser
  -- Si elle n'existe pas, cette fonction ne fera rien
  
  -- Exemple de logique (à adapter selon votre schéma réel) :
  -- v_old_commercial := COALESCE(OLD.commercial_assigne_id, OLD.responsable_id);
  -- v_new_commercial := COALESCE(NEW.commercial_assigne_id, NEW.responsable_id);
  
  -- Pour l'instant, on retourne simplement NEW sans créer de notification
  -- car la table commandes n'a pas de colonne d'assignation
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ÉTAPE 13: Créer les triggers
-- ============================================================================

-- Trigger pour création de lead
DROP TRIGGER IF EXISTS trg_notify_lead_created ON public.leads;
CREATE TRIGGER trg_notify_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_created();

-- Trigger pour assignation de lead (INSERT ou UPDATE)
DROP TRIGGER IF EXISTS trg_notify_lead_assigned ON public.leads;
CREATE TRIGGER trg_notify_lead_assigned
  AFTER INSERT OR UPDATE OF commercial_assigne_id, responsable_id ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_lead_assigned();

-- Trigger pour création de commande
DROP TRIGGER IF EXISTS trg_notify_order_created ON public.commandes;
CREATE TRIGGER trg_notify_order_created
  AFTER INSERT ON public.commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_created();

-- Trigger pour assignation de commande (préparé pour le futur, non actif pour l'instant)
-- DROP TRIGGER IF EXISTS trg_notify_order_assigned ON public.commandes;
-- CREATE TRIGGER trg_notify_order_assigned
--   AFTER INSERT OR UPDATE OF commercial_assigne_id, responsable_id ON public.commandes
--   FOR EACH ROW
--   EXECUTE FUNCTION public.notify_order_assigned();

-- ============================================================================
-- ÉTAPE 14: Commentaires pour documentation
-- ============================================================================

COMMENT ON TABLE public.notifications IS 'Table centrale pour toutes les notifications de l''admin (leads, commandes, système)';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification: lead_created, lead_assigned, order_created, order_assigned, system';
COMMENT ON COLUMN public.notifications.entity_type IS 'Type d''entité liée: lead, order, system';
COMMENT ON COLUMN public.notifications.entity_id IS 'ID de l''entité liée (lead.id ou commande.id)';
COMMENT ON COLUMN public.notifications.recipient_user_id IS 'ID utilisateur destinataire (nullable pour notifications globales)';
COMMENT ON COLUMN public.notifications.recipient_role IS 'Rôle destinataire (nullable, pour notifications par rôle: admin, manager, commercial, etc.)';
COMMENT ON COLUMN public.notifications.status IS 'Statut: unread (non lue) ou read (lue)';
COMMENT ON COLUMN public.notifications.meta IS 'Métadonnées JSONB supplémentaires (données du lead/commande, etc.)';

COMMENT ON FUNCTION public.notify_lead_created() IS 'Fonction trigger pour créer automatiquement une notification lors de la création d''un lead (destinée aux managers)';
COMMENT ON FUNCTION public.notify_lead_assigned() IS 'Fonction trigger pour créer automatiquement une notification lors de l''assignation d''un lead à un commercial';
COMMENT ON FUNCTION public.notify_order_created() IS 'Fonction trigger pour créer automatiquement une notification lors de la création d''une commande (destinée aux managers)';
COMMENT ON FUNCTION public.notify_order_assigned() IS 'Fonction trigger pour créer automatiquement une notification lors de l''assignation d''une commande (préparée pour le futur)';