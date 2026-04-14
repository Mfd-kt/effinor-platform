/**
 * Composant de routing intelligent basé sur les rôles
 * 
 * Affiche le bon composant selon le rôle de l'utilisateur.
 * 
 * Utilisation :
 * <RoleBasedRoute 
 *   adminComponent={<AdminDashboard />}
 *   commercialComponent={<CommercialDashboard />}
 *   defaultComponent={<AdminDashboard />}
 * />
 */

import React from 'react';
import { useUser } from '@/contexts/UserContext';

export default function RoleBasedRoute({ 
  adminComponent,
  commercialComponent,
  technicienComponent,
  callcenterComponent,
  defaultComponent 
}) {
  const { profile } = useUser();
  const userRole = profile?.role?.slug || '';

  // Déterminer quel composant afficher selon le rôle
  if (userRole === 'commercial' && commercialComponent) {
    return commercialComponent;
  }

  if (userRole === 'technicien' && technicienComponent) {
    return technicienComponent;
  }

  if (userRole === 'callcenter' && callcenterComponent) {
    return callcenterComponent;
  }

  // Pour admin, super_admin ou par défaut
  if (adminComponent) {
    return adminComponent;
  }

  // Fallback vers le composant par défaut (ne pas importer de pages ici pour garder le code-splitting)
  return defaultComponent || null;
}

