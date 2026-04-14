/**
 * Composant de protection des routes basé sur les rôles
 * 
 * Vérifie que l'utilisateur est authentifié ET a un des rôles autorisés.
 * Vérifie également que la session Supabase est valide et que le profil est actif.
 * Redirige vers /login si non authentifié ou session invalide.
 * Redirige vers /dashboard si rôle non autorisé.
 * 
 * Utilisation :
 * <RequireRole roles={['admin', 'super_admin']}>
 *   <YourComponent />
 * </RequireRole>
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function RequireRole({ children, roles = [] }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  const location = useLocation();
  const { toast } = useToast();
  const [sessionValid, setSessionValid] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);

  // Vérifier la validité de la session Supabase
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setSessionValid(false);
          return;
        }
        
        setSessionValid(true);
      } catch (err) {
        console.error('[RequireRole] Erreur vérification session:', err);
        setSessionValid(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setSessionValid(false);
      } else if (event === 'TOKEN_REFRESHED') {
        setSessionValid(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Afficher un message de chargement pendant la vérification
  if (authLoading || profileLoading || checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté ou session invalide, rediriger vers la page de login
  if (!user || !sessionValid) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, reason: !sessionValid ? 'session_expired' : 'not_authenticated' }}
      />
    );
  }

  // Vérifier que le profil est actif
  if (profile && (!profile.active || profile.statut_emploi === 'suspendu')) {
    toast({
      variant: 'destructive',
      title: 'Compte désactivé',
      description: 'Votre compte a été désactivé. Veuillez contacter un administrateur.'
    });
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, reason: 'account_inactive' }}
      />
    );
  }

  // Vérifier le rôle de l'utilisateur
  const userRole = profile?.role?.slug || '';
  
  // Logs de debug (uniquement en mode DEV)
  if (import.meta.env.DEV) {
    console.log('[RequireRole] Vérification accès:', {
      path: location.pathname,
      userRole,
      rolesRequired: roles,
      profileExists: !!profile,
      profileRole: profile?.role,
      profileRoleSlug: profile?.role?.slug,
      profileStructure: profile ? {
        id: profile.id,
        email: profile.email,
        role_id: profile.role_id,
        role: profile.role
      } : null
    });
  }
  
  // Si aucun rôle requis n'est spécifié, autoriser tous les utilisateurs authentifiés
  if (roles.length === 0) {
    if (import.meta.env.DEV) {
      console.log('[RequireRole] Aucun rôle requis, accès autorisé');
    }
    return <>{children}</>;
  }

  // Vérifier si l'utilisateur a un des rôles autorisés
  const hasRequiredRole = roles.some(role => {
    const matches = userRole === role || 
           userRole === role.replace('_', '') ||
           (role === 'admin' && (userRole === 'super_admin' || userRole === 'admin'));
    
    if (import.meta.env.DEV && matches) {
      console.log(`[RequireRole] Match trouvé: userRole="${userRole}" === requiredRole="${role}"`);
    }
    
    return matches;
  });

  if (import.meta.env.DEV) {
    console.log('[RequireRole] Résultat vérification:', {
      hasRequiredRole,
      userRole,
      rolesRequired: roles,
      willRedirect: !hasRequiredRole
    });
  }

  // Si l'utilisateur n'a pas le rôle requis, rediriger vers le dashboard
  if (!hasRequiredRole) {
    if (import.meta.env.DEV) {
      console.warn('[RequireRole] Accès refusé - redirection vers /dashboard', {
        userRole,
        rolesRequired: roles,
        path: location.pathname
      });
    }
    toast({
      variant: 'destructive',
      title: 'Accès refusé',
      description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'
    });
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{ 
          from: location,
          message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.'
        }}
      />
    );
  }

  // Utilisateur connecté avec le bon rôle : afficher le contenu protégé
  if (import.meta.env.DEV) {
    console.log('[RequireRole] Accès autorisé, affichage du contenu');
  }
  return <>{children}</>;
}

