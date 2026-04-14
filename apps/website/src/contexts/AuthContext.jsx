/**
 * AuthContext — Supabase désactivé.
 * user est toujours null, loading toujours false.
 * Les pages admin ne sont pas accessibles (pas d'authentification).
 */
import React, { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const value = {
    user: null,
    session: null,
    loading: false,
    error: null,
    signInWithPassword: async () => ({ error: { message: 'Authentification désactivée' } }),
    signOut: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
