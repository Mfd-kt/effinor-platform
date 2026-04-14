/**
 * Error Boundary pour capturer les erreurs d'authentification
 * 
 * Redirige automatiquement vers /login en cas d'erreur d'authentification
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

class AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Vérifier si l'erreur est liée à l'authentification
    const isAuthError = 
      error?.message?.includes('auth') ||
      error?.message?.includes('session') ||
      error?.message?.includes('unauthorized') ||
      error?.message?.includes('permission') ||
      error?.message?.includes('authentication');
    
    if (isAuthError) {
      return { hasError: true, error };
    }
    
    // Pour les autres erreurs, laisser le parent ErrorBoundary les gérer
    return { hasError: false, error: null };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur en développement
    if (import.meta.env.DEV) {
      console.error('[AuthErrorBoundary] Erreur capturée:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Rediriger vers login en cas d'erreur d'authentification
      return (
        <Navigate
          to="/login"
          replace
          state={{ 
            reason: 'auth_error',
            error: this.state.error?.message 
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;



















