/** NotificationsContext — Supabase désactivé. Retourne un état vide. */
import React, { createContext, useContext } from 'react';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const value = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    markAsRead: async () => {},
    markAllAsRead: async () => {},
    deleteNotification: async () => {},
  };
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) return { notifications: [], unreadCount: 0, loading: false, markAsRead: () => {}, markAllAsRead: () => {}, deleteNotification: () => {} };
  return ctx;
};

export default NotificationsContext;
