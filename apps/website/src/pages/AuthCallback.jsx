import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

function getParams() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const search = new URLSearchParams(window.location.search);
  
  const allParams = {};
  for (const [key, value] of hash.entries()) {
    allParams[key] = value;
  }
  for (const [key, value] of search.entries()) { // Fixed: changed 'value}' to 'value]'
    allParams[key] = value;
  }

  return {
    type: allParams.type,
    next: allParams.next || '/dashboard',
    accessToken: allParams.access_token,
    refreshToken: allParams.refresh_token,
  };
}

export default function AuthCallback() {
  const { type, next, accessToken, refreshToken } = useMemo(getParams, []);
  const [phase, setPhase] = useState('exchanging');
  const [error, setError] = useState(null);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');

  useEffect(() => {
    (async () => {
      // Attendre un peu pour que Supabase traite automatiquement le hash (detectSessionInUrl)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Vérifier d'abord si Supabase a déjà créé une session (via detectSessionInUrl)
      const { data: { session: existingSession }, error: sessionCheckError } = await supabase.auth.getSession();
      
      if (existingSession && existingSession.user) {
        logger.log('✅ Session détectée automatiquement par Supabase');
        
        // Si c'est une invitation ou récupération, demander le mot de passe
        if (type === 'invite' || type === 'recovery') {
          setPhase('needs_password');
          return;
        }
        
        // Sinon, rediriger vers le dashboard
        setPhase('done');
        const redirectUrl = next || '/dashboard';
        window.location.replace(redirectUrl);
        return;
      }
      
      // Si on a les tokens dans l'URL (magic link, invite, recovery)
      if (accessToken && refreshToken) {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            logger.error('Erreur setSession:', sessionError);
            setError(sessionError.message || "Erreur lors de l'authentification");
            setPhase('error');
            return;
          }

          // Vérifier si c'est une invitation ou une récupération (nécessite un mot de passe)
          if (type === 'invite' || type === 'recovery') {
            setPhase('needs_password');
          } else {
            // Connexion réussie, rediriger
            setPhase('done');
            const redirectUrl = next || '/dashboard';
            window.location.replace(redirectUrl);
          }
        } catch (err) {
          logger.error('Erreur inattendue dans AuthCallback:', err);
          setError(err.message || "Une erreur inattendue est survenue");
          setPhase('error');
        }
      } else if (accessToken && !refreshToken) {
        // Cas où on a seulement access_token (peut arriver avec certaines invitations)
        logger.log('⚠️ Access token présent mais pas de refresh token');
        setError("Token d'authentification incomplet. Veuillez utiliser le lien complet de l'email.");
        setPhase('error');
      } else {
        // Pas de tokens dans l'URL et pas de session existante
        logger.log('⚠️ Aucun token ou session détecté');
        setError("Paramètres d'authentification manquants dans l'URL.");
        setPhase('error');
      }
    })();
  }, [type, next, accessToken, refreshToken]);

  const onSetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (!pwd || pwd.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (pwd !== pwd2) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    // 1. Mettre à jour le mot de passe de l'utilisateur
    const { data: { user }, error: updateUserError } = await supabase.auth.updateUser({ password: pwd });

    if (updateUserError) {
      setError(updateUserError.message);
      return;
    }
    
    // 2. Lier l'utilisateur auth à la table `utilisateurs`
    // En prod, le cas le plus fréquent est: une ligne `utilisateurs` existe déjà (créée par l'admin),
    // mais `auth_user_id` n'est pas encore renseigné. Sans ce lien, RequireRole bloque /dashboard.
    if (user && type === 'invite') {
      const emailLower = (user.email || '').toLowerCase();
      if (emailLower) {
        try {
          // Chercher un profil existant par email
          const { data: existingProfile, error: findError } = await supabase
            .from('utilisateurs')
            .select('id, auth_user_id, email')
            .eq('email', emailLower)
            .maybeSingle();

          if (findError) {
            logger.error('[AuthCallback] Erreur recherche profil utilisateurs:', findError);
          } else if (existingProfile?.id) {
            // Mettre à jour le lien auth_user_id si manquant/différent
            if (!existingProfile.auth_user_id || existingProfile.auth_user_id !== user.id) {
              const { error: linkError } = await supabase
                .from('utilisateurs')
                .update({ auth_user_id: user.id })
                .eq('id', existingProfile.id);

              if (linkError) {
                logger.error('[AuthCallback] Erreur liaison auth_user_id:', linkError);
              } else {
                logger.log('✅ Liaison auth_user_id effectuée sur utilisateurs');
              }
            }
          } else {
            // Pas de profil existant: on ne force pas une insertion risquée (schéma variable).
            // On affiche un message clair: l'admin doit créer le profil ou vérifier les triggers.
            logger.warn('[AuthCallback] Aucun profil utilisateurs trouvé pour cet email. Création manuelle requise.');
          }
        } catch (e) {
          logger.error('[AuthCallback] Erreur inattendue liaison utilisateurs:', e);
        }
      }
    }

    // 3. Rediriger vers l'admin
    window.location.replace(next || '/dashboard');
  };

  if (phase === 'exchanging') {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-600 mb-4" />
          <p className="text-gray-600">Finalisation de la connexion...</p>
        </div>
    );
  }

  if (phase === 'needs_password') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-6">Définir votre mot de passe</h1>
          <form onSubmit={onSetPassword} className="space-y-4">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="w-full border rounded-lg p-3"
              required
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              className="w-full border rounded-lg p-3"
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button className="w-full bg-secondary-600 text-white rounded-lg px-4 py-3 font-semibold hover:bg-secondary-700 transition-colors">
                Valider et me connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lien invalide ou expiré</h1>
          <p className="mb-6 text-gray-700">{error}</p>
          <a className="text-secondary-600 underline font-semibold" href="/login">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-secondary-600 mb-4" />
      <p className="text-gray-600">Redirection...</p>
    </div>
  );
}