import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Helmet } from 'react-helmet';
import { logger } from '@/utils/logger';

const LoginDirect = () => {
  const [email, setEmail] = useState('koutmoufdi.pro@gmail.com');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState({ type: '', message: '' });
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();

  const displayDebugInfo = useCallback(async () => {
    logger.log('Updating debug info...');
    const { data: { session } } = await supabase.auth.getSession();
    let lsData = {};
    try {
      lsData = {
        user_id: localStorage.getItem('user_id'),
        user_email: localStorage.getItem('user_email'),
        user_role: localStorage.getItem('user_role'),
        user_name: localStorage.getItem('user_name'),
      };
    } catch (e) {
      logger.error("Could not access localStorage:", e);
    }
    
    const info = `
Timestamp: ${new Date().toISOString()}
-----------------------------------
Session Status: ${session ? 'ACTIVE' : 'INACTIVE'}
User ID: ${session?.user?.id || 'N/A'}
User Email: ${session?.user?.email || 'N/A'}
-----------------------------------
LocalStorage Data:
${JSON.stringify(lsData, null, 2)}
    `;
    setDebugInfo(info);
  }, []);

  useEffect(() => {
    logger.log("LoginDirect page loaded.");
    displayDebugInfo();
    const interval = setInterval(displayDebugInfo, 5000);
    return () => clearInterval(interval);
  }, [displayDebugInfo]);

  const clearResults = () => {
    setResult({ type: '', message: '' });
  };
  
  const loginDirect = async () => {
    clearResults();

    if (!email) {
      setResult({ type: 'error', message: 'Veuillez entrer un email.' });
      return;
    }
    if (!password) {
      setResult({ type: 'error', message: 'Veuillez entrer un mot de passe.' });
      return;
    }

    setResult({ type: 'loading', message: 'Tentative de connexion en cours...' });
    logger.log(`Login attempt with email: ${email}`);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        logger.error('Authentication error:', error);
        setResult({ type: 'error', message: `Erreur: ${error.message}` });
        return;
      }

      logger.log('Authentication response:', data);
      const successMessage = `
        <p>✅ Connexion réussie !</p>
        <p><strong>User ID:</strong> ${data.user.id}</p>
        <p><strong>Email:</strong> ${data.user.email}</p>
        <p>Redirection vers le tableau de bord dans 2 secondes...</p>
      `;
      setResult({ type: 'success', message: successMessage });

      // Store data for debugging purposes
      localStorage.setItem('user_email', data.user.email);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('user_role', data.user.app_metadata.role || 'super_admin');
      localStorage.setItem('user_name', data.user.user_metadata.full_name || data.user.email);

      displayDebugInfo();

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (e) {
      logger.error('Generic error:', e);
      setResult({ type: 'error', message: `Une erreur générique est survenue: ${e.message}` });
    }
  };

  return (
    <>
      <Helmet>
        <title>Connexion Directe | Debug</title>
      </Helmet>
      <div className="login-direct-page">
        <div className="login-direct-container">
          <h1>🔐 Connexion Directe</h1>
          <p className="subtitle">Page de test et débogage</p>
          
          <div className="form-group">
            <label htmlFor="email-direct">Email</label>
            <input 
              type="email" 
              id="email-direct" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password-direct">Mot de passe</label>
            <input 
              type="password" 
              id="password-direct" 
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button onClick={loginDirect} className="btn-login">
            Se connecter
          </button>
          
          {result.message && (
            <div id="result" className={`result-box ${result.type} show`} dangerouslySetInnerHTML={{ __html: result.message }}>
            </div>
          )}
          
          <div className="debug-section">
            <h3>📋 Informations de Débogage</h3>
            <div id="debug-info" className="debug-info">
              {debugInfo}
            </div>
          </div>
          
          <div className="instructions">
            <h3>📖 Instructions</h3>
            <ol>
              <li>Entrez votre email et mot de passe.</li>
              <li>Cliquez sur "Se connecter".</li>
              <li>Vérifiez les résultats ci-dessus.</li>
              <li>Consultez la console du navigateur (F12) pour plus de détails.</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginDirect;