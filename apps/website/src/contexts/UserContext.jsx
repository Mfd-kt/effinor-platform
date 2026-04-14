/** UserContext — Supabase désactivé. Profil toujours null. */
import React, { createContext, useContext } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const value = {
    profile: null,
    loading: false,
    error: null,
    refreshProfile: async () => {},
  };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) return { profile: null, loading: false, error: null, refreshProfile: () => {} };
  return ctx;
};

export default UserContext;
