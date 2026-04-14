-- Migration: Création du système de notifications complet
-- Date: 2025-12-01
-- Description: Crée la table notifications et les triggers pour générer automatiquement
-- des notifications lors de la création de leads et commandes

-- ÉTAPE 1: Créer la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('lead', 'commande', 'system')),
  entity_id UUID, -- id du lead ou de la commande
  title TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  -- Pour plus tard si on veut des notifications par utilisateur
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- ÉTAPE 2: Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON public.notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_status 
  ON public.notifications (status);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON public.notifications (type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications (user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_entity_id 
  ON public.notifications (entity_id) 
  WHERE entity_id IS NOT NULL;

-- ÉTAPE 3: Fonction pour notifier un nouveau lead
CREATE OR REPLACE FUNCTION public.notify_new_lead()
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
  
  -- Insérer la notification
  INSERT INTO public.notifications (type, entity_id, title, message)
  VALUES ('lead', NEW.id, title_text, message_text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 4: Fonction pour notifier une nouvelle commande
CREATE OR REPLACE FUNCTION public.notify_new_commande()
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
  
  -- Insérer la notification
  INSERT INTO public.notifications (type, entity_id, title, message)
  VALUES ('commande', NEW.id, title_text, message_text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 5: Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trg_notify_new_lead ON public.leads;
DROP TRIGGER IF EXISTS trg_notify_new_commande ON public.commandes;

-- ÉTAPE 6: Créer les triggers AFTER INSERT
CREATE TRIGGER trg_notify_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_lead();

CREATE TRIGGER trg_notify_new_commande
  AFTER INSERT ON public.commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_commande();

-- ÉTAPE 7: Commentaires pour documentation
COMMENT ON TABLE public.notifications IS 'Table centrale pour toutes les notifications de l''admin (leads, commandes, système)';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification: lead, commande, system';
COMMENT ON COLUMN public.notifications.entity_id IS 'ID de l''entité liée (lead.id ou commande.id)';
COMMENT ON COLUMN public.notifications.status IS 'Statut: unread (non lue) ou read (lue)';
COMMENT ON COLUMN public.notifications.user_id IS 'ID utilisateur (nullable pour notifications globales, à utiliser plus tard pour notifications personnalisées)';

COMMENT ON FUNCTION public.notify_new_lead() IS 'Fonction trigger pour créer automatiquement une notification lors de la création d''un lead';
COMMENT ON FUNCTION public.notify_new_commande() IS 'Fonction trigger pour créer automatiquement une notification lors de la création d''une commande';

-- ÉTAPE 8: Activer Realtime sur la table notifications (nécessite d'être fait dans Supabase Dashboard)
-- Aller dans Database > Replication et activer la réplication pour la table 'notifications'



















