/**
 * Hook pour vérifier que l'utilisateur a le rôle requis
 * 
 * Vérifie que l'utilisateur a un des rôles autorisés.
 * Redirige vers /dashboard si non autorisé.
 * 
 * @param {Array<string>} requiredRoles - Liste des rôles autorisés
 * @returns {Object} { hasAccess, userRole, loading }
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

export const useRequireRole = (requiredRoles = []) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profile, loading } = useUser();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    // Si aucun rôle requis, autoriser tous les utilisateurs authentifiés
    if (requiredRoles.length === 0) {
      setHasAccess(true);
      return;
    }

    const userRole = profile?.role?.slug || '';

    if (import.meta.env.DEV) {
      console.log('[useRequireRole] Vérification:', {
        userRole,
        requiredRoles,
        profile: profile ? { id: profile.id, role_id: profile.role_id, role: profile.role } : null
      });
    }

    // Vérifier si l'utilisateur a un des rôles autorisés
    const hasRequiredRole = requiredRoles.some(role => {
      const matches = userRole === role || 
             userRole === role.replace('_', '') ||
             (role === 'admin' && (userRole === 'super_admin' || userRole === 'admin')) ||
             (role === 'super_admin' && userRole === 'super_admin');
      
      if (import.meta.env.DEV && matches) {
        console.log(`[useRequireRole] Match trouvé: userRole=${userRole}, requiredRole=${role}`);
      }
      
      return matches;
    });

    if (import.meta.env.DEV) {
      console.log('[useRequireRole] Résultat:', { hasRequiredRole, userRole, requiredRoles });
    }

    if (!hasRequiredRole) {
      setHasAccess(false);
      if (import.meta.env.DEV) {
        console.warn('[useRequireRole] Accès refusé - redirection vers /dashboard');
      }
      toast({
        variant: 'destructive',
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'
      });
      navigate('/dashboard', { replace: true, state: { from: location } });
    } else {
      setHasAccess(true);
    }
  }, [profile, loading, requiredRoles, navigate, location, toast]);

  return {
    hasAccess,
    userRole: profile?.role?.slug || '',
    loading
  };
};

