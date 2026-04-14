/**
 * Hook pour vérifier que l'utilisateur est authentifié
 * 
 * Vérifie constamment que l'utilisateur est authentifié et que la session est valide.
 * Redirige automatiquement vers /login si non authentifié ou si la session expire.
 * 
 * @returns {Object} { user, profile, isAuthenticated, loading }
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabaseClient';

export const useRequireAuth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUser();
  const [sessionValid, setSessionValid] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);

  // Vérifier la validité de la session Supabase
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setSessionValid(false);
          // Rediriger vers login si session invalide
          navigate('/login', { replace: true, state: { reason: 'session_expired' } });
          return;
        }
        
        setSessionValid(true);
      } catch (err) {
        console.error('[useRequireAuth] Erreur vérification session:', err);
        setSessionValid(false);
        navigate('/login', { replace: true, state: { reason: 'session_error' } });
      } finally {
        setCheckingSession(false);
      }
    };

    // Vérifier immédiatement
    checkSession();

    // Vérifier périodiquement (toutes les 5 minutes)
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setSessionValid(false);
        navigate('/login', { replace: true, state: { reason: 'signed_out' } });
      } else if (event === 'TOKEN_REFRESHED') {
        setSessionValid(true);
      }
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Vérifier que le profil est actif
  useEffect(() => {
    if (profile && !profileLoading) {
      if (!profile.active || profile.statut_emploi === 'suspendu') {
        // Compte désactivé ou suspendu
        navigate('/login', { replace: true, state: { reason: 'account_inactive' } });
      }
    }
  }, [profile, profileLoading, navigate]);

  const isAuthenticated = !authLoading && !profileLoading && !checkingSession && user && sessionValid && profile?.active;

  return {
    user,
    profile,
    isAuthenticated,
    loading: authLoading || profileLoading || checkingSession
  };
};



















