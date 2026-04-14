/**
 * Service de notifications
 * 
 * Centralise tous les appels Supabase pour la gestion des notifications
 */

import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';

/**
 * @typedef {'lead_created' | 'lead_assigned' | 'order_created' | 'system'} NotificationType
 * @typedef {'unread' | 'read'} NotificationStatus
 * @typedef {'lead' | 'order' | 'system'} EntityType
 * @typedef {'admin' | 'manager' | 'commercial' | 'technicien' | 'viewer'} RecipientRole
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {NotificationType} type
 * @property {string} title
 * @property {string | null} message
 * @property {EntityType | null} entity_type
 * @property {string | null} entity_id
 * @property {string | null} recipient_user_id
 * @property {RecipientRole | null} recipient_role
 * @property {NotificationStatus} status
 * @property {string} created_at
 * @property {string | null} read_at
 */

/**
 * Récupère les notifications depuis Supabase
 * 
 * Les notifications sont automatiquement filtrées par RLS selon :
 * - L'utilisateur connecté (recipient_user_id)
 * - Le rôle de l'utilisateur (recipient_role)
 * - Les notifications globales (sans recipient)
 * 
 * @param {Object} params - Paramètres de filtrage
 * @param {number} [params.limit=20] - Nombre maximum de notifications à récupérer
 * @param {NotificationStatus | 'all'} [params.status='all'] - Filtrer par statut
 * @param {NotificationType | 'all'} [params.type='all'] - Filtrer par type
 * @param {string} [params.since] - Date ISO depuis laquelle récupérer (optionnel)
 * @returns {Promise<Notification[]>}
 */
export async function fetchNotifications(params = {}) {
  const { 
    limit = 20, 
    status = 'all',
    type = 'all',
    since = null
  } = params;

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (type !== 'all') {
      query = query.eq('type', type);
    }

    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('[notifications] Erreur fetchNotifications:', error);
      throw error;
    }

    return (data || []);
  } catch (error) {
    logger.error('[notifications] Erreur fetchNotifications:', error);
    throw error;
  }
}

/**
 * Marque une notification comme lue
 * 
 * @param {string} id - ID de la notification
 * @returns {Promise<void>}
 */
export async function markNotificationAsRead(id) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        status: 'read', 
        read_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      logger.error('[notifications] Erreur markNotificationAsRead:', error);
      throw error;
    }
  } catch (error) {
    logger.error('[notifications] Erreur markNotificationAsRead:', error);
    throw error;
  }
}

/**
 * Marque toutes les notifications non lues comme lues
 * 
 * @returns {Promise<void>}
 */
export async function markAllNotificationsAsRead() {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        status: 'read', 
        read_at: new Date().toISOString() 
      })
      .eq('status', 'unread');

    if (error) {
      logger.error('[notifications] Erreur markAllNotificationsAsRead:', error);
      throw error;
    }
  } catch (error) {
    logger.error('[notifications] Erreur markAllNotificationsAsRead:', error);
    throw error;
  }
}

/**
 * Marque une notification comme non lue
 * 
 * @param {string} id - ID de la notification
 * @returns {Promise<void>}
 */
export async function markNotificationAsUnread(id) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        status: 'unread', 
        read_at: null 
      })
      .eq('id', id);

    if (error) {
      logger.error('[notifications] Erreur markNotificationAsUnread:', error);
      throw error;
    }
  } catch (error) {
    logger.error('[notifications] Erreur markNotificationAsUnread:', error);
    throw error;
  }
}

/**
 * Récupère le nombre de notifications non lues pour l'utilisateur connecté
 * 
 * Les notifications sont automatiquement filtrées par RLS selon :
 * - L'utilisateur connecté (recipient_user_id)
 * - Le rôle de l'utilisateur (recipient_role)
 * - Les notifications globales (sans recipient)
 * 
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread');

    if (error) {
      logger.error('[notifications] Erreur getUnreadCount:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    logger.error('[notifications] Erreur getUnreadCount:', error);
    return 0;
  }
}

/**
 * Crée une notification système manuellement (pour usage futur)
 * 
 * @param {Object} params
 * @param {string} params.title - Titre de la notification
 * @param {string} [params.message] - Message optionnel
 * @param {string} [params.recipient_user_id] - ID utilisateur destinataire (optionnel)
 * @param {RecipientRole} [params.recipient_role] - Rôle destinataire (optionnel)
 * @returns {Promise<Notification>}
 */
export async function createSystemNotification({ 
  title, 
  message = null, 
  recipient_user_id = null,
  recipient_role = null 
}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        type: 'system',
        title,
        message,
        entity_type: 'system',
        recipient_user_id,
        recipient_role,
        status: 'unread'
      }])
      .select()
      .single();

    if (error) {
      logger.error('[notifications] Erreur createSystemNotification:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('[notifications] Erreur createSystemNotification:', error);
    throw error;
  }
}

