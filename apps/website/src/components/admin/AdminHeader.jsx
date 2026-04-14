/**
 * Header de l'admin avec notifications
 * 
 * Affiche une icône cloche avec badge et dropdown des notifications
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bell, UserPlus, ShoppingBag, Loader2, Check, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useUser } from '@/contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

const AdminHeader = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { profile } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Get notifications URL based on user role
  const getNotificationsUrl = () => {
    const roleSlug = profile?.role?.slug || '';
    if (roleSlug === 'commercial') {
      return '/notifications';
    }
    return '/notifications';
  };

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  const handleNotificationClick = async (notification) => {
    // Marquer comme lue si non lue
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    setDropdownOpen(false);
    
    // Navigation vers la ressource selon le rôle
    const roleSlug = profile?.role?.slug || '';
    const isCommercial = roleSlug === 'commercial';
    
    if ((notification.type === 'lead_created' || notification.type === 'lead_assigned') && notification.entity_id) {
      navigate(`/leads/${notification.entity_id}`);
    } else if (notification.type === 'order_created' && notification.entity_id) {
      navigate('/dashboard');
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setDropdownOpen(false);
  };

  const formatNotificationDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch {
      return 'Récemment';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'lead_created':
      case 'lead_assigned':
        return <UserPlus className="h-4 w-4 text-emerald-500" />;
      case 'order_created':
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Settings className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'lead_created':
        return 'Nouveau lead';
      case 'lead_assigned':
        return 'Lead assigné';
      case 'order_created':
        return 'Nouvelle commande';
      case 'system':
        return 'Système';
      default:
        return 'Notification';
    }
  };

  // Limiter à 10 notifications dans le dropdown
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        ref={buttonRef}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-gray-100 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label="Notifications"
        aria-expanded={dropdownOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-[600px] flex flex-col"
          style={{ boxShadow: '0 10px 40px rgba(15,23,42,0.12)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset ${
                      notification.status === 'unread' ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${notification.status === 'unread' ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                          {notification.title}
                        </p>
                        {notification.status === 'unread' && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer avec lien vers toutes les notifications */}
          {recentNotifications.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-2.5 text-right">
              <Link
                to={getNotificationsUrl()}
                onClick={() => setDropdownOpen(false)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
              >
                Voir toutes les notifications
                <span className="text-emerald-500">→</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminHeader;
