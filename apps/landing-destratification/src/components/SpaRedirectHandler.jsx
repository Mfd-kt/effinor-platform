import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Gère la redirection depuis 404.html pour les SPA sur Hostinger
 * Si l'utilisateur arrive via 404.html, on récupère le chemin original
 * stocké en sessionStorage et on navigue vers cette route
 */
const SpaRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('spa_redirect_path');
    
    if (redirectPath) {
      // Supprimer le chemin stocké pour éviter les boucles
      sessionStorage.removeItem('spa_redirect_path');
      
      // Naviguer vers le chemin original
      console.log('[SPA] Redirect from 404.html to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  return null;
};

export default SpaRedirectHandler;
