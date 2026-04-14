import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

/**
 * Composant de protection des routes espace client
 * Vérifie que l'utilisateur est authentifié ET a le rôle "client"
 */
const RequireClient = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  const location = useLocation();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-sm">Chargement...</p>
      </div>
    );
  }

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    return <Navigate to="/espace-client/login" state={{ from: location }} replace />;
  }

  // TODO: Vérifier que l'utilisateur a le rôle "client" ou est lié à clients_portail
  // Pour l'instant, on accepte tous les utilisateurs authentifiés
  // À améliorer avec une vérification dans clients_portail

  return children;
};

export default RequireClient;














