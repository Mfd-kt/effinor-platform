/**
 * Composant de protection des routes admin
 * 
 * Ce composant utilise le AuthContext pour vérifier si un utilisateur est authentifié.
 * Si l'utilisateur n'est pas connecté, il est redirigé vers la page de login.
 * 
 * Utilisation :
 * <RequireAdmin>
 *   <AdminLayout>
 *     <YourAdminPage />
 *   </AdminLayout>
 * </RequireAdmin>
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Afficher un message de chargement pendant la vérification de la session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-sm">Chargement de votre session...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
  // en conservant la page d'origine pour y revenir après connexion
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Utilisateur connecté : afficher le contenu protégé
  return <>{children}</>;
}