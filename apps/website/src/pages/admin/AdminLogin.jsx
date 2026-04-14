import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const errorMessages = {
  'invalid_credentials': "Email ou mot de passe incorrect.",
  'user_not_found': "Cet email n'existe pas dans notre base de données.",
  'user_banned': "Votre compte a été désactivé.",
  'too_many_requests': "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
  'network_error': "Erreur de connexion. Vérifiez votre connexion internet.",
  'profile_not_found': "Profil utilisateur non configuré. Contactez un administrateur.",
  'account_inactive': "Votre compte est désactivé. Veuillez contacter le support.",
  'account_suspended': "Votre compte a été suspendu. Veuillez contacter le support.",
  'generic_error': "Une erreur inattendue est survenue. Veuillez réessayer.",
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithPassword, loading: authLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);

  const displayError = (messageKey) => {
    const message = errorMessages[messageKey] || errorMessages['generic_error'];
    setErrorMsg(message);
    logger.error('Login Error:', message);
  };

  const handleResetPassword = async () => {
    if (!email || !email.trim()) {
      setErrorMsg("Merci de saisir votre email pour recevoir le lien de réinitialisation.");
      setInfoMessage(null);
      return;
    }

    try {
      setResetLoading(true);
      setErrorMsg(null);
      setInfoMessage(null);

      const redirectTo = `${window.location.origin}/reset-password`;
      logger.log('[ResetPassword] redirectTo:', redirectTo);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        logger.error('[ResetPassword] error', error);
        setErrorMsg(error.message || "Erreur lors de l'envoi de l'email de réinitialisation.");
        setInfoMessage(null);
        return;
      }

      // Succès - utiliser toast et infoMessage
      toast({
        title: 'Email envoyé',
        description: "Un email de réinitialisation vient d'être envoyé. Pense à vérifier tes spams.",
      });
      setInfoMessage("Un email de réinitialisation vient d'être envoyé. Pense à vérifier tes spams.");
      setErrorMsg(null);
    } catch (err) {
      logger.error('[ResetPassword] unexpected error', err);
      setErrorMsg("Une erreur inattendue est survenue. Veuillez réessayer.");
      setInfoMessage(null);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 1. Input Validation
    if (!email.trim() || !password) {
      displayError(!email.trim() ? 'Veuillez saisir votre email.' : 'Veuillez saisir votre mot de passe.');
      setLoading(false);
      return;
    }

    try {
      // 2. Authentication via AuthContext
      const { error: signInError } = await signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        // Map Supabase auth errors to our custom messages
        if (signInError.message.includes('Invalid login credentials')) {
          displayError('invalid_credentials');
        } else {
          displayError('generic_error');
        }
        setPassword(''); // Clear password field on error
        throw signInError;
      }

      // Récupérer les données de session depuis Supabase directement pour le profil
      const { data: { session } } = await supabase.auth.getSession();
      const authData = { user: session?.user };
      
      // 3. Load User Profile from 'utilisateurs'
      // Note: We use role_id foreign key explicitly because there are two FKs (role_id and role_slug)
      const { data: profile, error: profileError } = await supabase
        .from('utilisateurs')
        .select(`
          *,
          role:roles!utilisateurs_role_id_fkey(slug, label)
        `)
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        displayError('generic_error');
        await supabase.auth.signOut();
        throw profileError;
      }
      
      // 4. Validate Profile
      if (!profile) {
        displayError('profile_not_found');
        await supabase.auth.signOut();
        return;
      }
      
      // 5. Check Account Status
      if (!profile.active) {
        displayError('account_inactive');
        await supabase.auth.signOut();
        return;
      }
      
      if (profile.statut_emploi === 'suspendu') {
        displayError('account_suspended');
        await supabase.auth.signOut();
        return;
      }

      // 6. Success and Redirect
      logger.log(`Login successful for ${profile.full_name || profile.email}`);
      const userRoleSlug = profile.role?.slug || '';
      logger.log(`[AdminLogin] Profile role_id: ${profile.role_id}, role.slug: ${userRoleSlug}`);
      toast({ title: 'Connexion réussie !', description: `Bienvenue, ${profile.full_name || profile.email}` });
      
      // Optional: Store user info
      localStorage.setItem('user_id', profile.id);
      localStorage.setItem('user_email', profile.email);
      localStorage.setItem('user_name', profile.full_name);
      localStorage.setItem('user_role', userRoleSlug);
      
      // Redirect to unified dashboard route (RoleBasedRoute will handle the correct component)
      logger.log('[AdminLogin] Redirecting to /dashboard (unified route)');
      navigate('/dashboard', { replace: true });

    } catch (error) {
       // Errors are handled and displayed inside the try block
       // This catch is for any truly unexpected issues
       if (!errorMsg) {
         displayError('generic_error');
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Connexion | Effinor Admin</title></Helmet>
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <img alt="Logo Effinor" className="mx-auto h-12 w-auto mb-4" src="https://i.ibb.co/6rT1m18/logo-ecps.png" />
              <h1>Connexion</h1>
              <p>Accédez à votre espace de gestion</p>
            </div>
            
            {(errorMsg || authError) && (
              <div id="error-message" className="error-alert">
                <span className="error-icon" role="img" aria-label="error icon">❌</span>
                <span id="error-text">{errorMsg || authError}</span>
              </div>
            )}
            
            {infoMessage && (
              <div className="mt-2 p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                {infoMessage}
              </div>
            )}
            
            <form id="login-form" onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  placeholder="votre.email@effinor.fr"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="form-remember">
                <input type="checkbox" id="remember" name="remember" />
                <label htmlFor="remember">Se souvenir de moi</label>
              </div>
              
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Se connecter'}
                {loading && 'Connexion...'}
              </button>
            </form>
            
            <div className="login-footer">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-sm text-blue-600 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resetLoading ? "Envoi en cours..." : "Mot de passe oublié ?"}
              </button>
              <span className="divider">•</span>
              <Link to="/signup">Créer un compte</Link>
            </div>
          </div>
          
          <div className="login-info">
            <h2>Bienvenue chez Effinor</h2>
            <p>Gérez vos leads et vos dossiers CEE en toute simplicité.</p>
            <ul className="info-list">
              <li>✅ Gestion complète des projets</li>
              <li>✅ Suivi des devis en temps réel</li>
              <li>✅ Accès aux ressources techniques</li>
              <li>✅ Support personnalisé</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;