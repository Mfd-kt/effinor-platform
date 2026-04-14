import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie_consent';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch (_) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      setVisible(false);
    } catch (_) {}
  };

  const refuse = () => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, 'refused');
      setVisible(false);
    } catch (_) {}
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Choix des cookies"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
    >
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-gray-700 rounded-lg">
              <Cookie className="w-5 h-5 text-amber-400" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-100">
                Nous utilisons des cookies pour le bon fonctionnement du site, la mesure d'audience et l'optimisation de nos campagnes.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <Link to="/politique-de-confidentialite" className="underline hover:text-white transition-colors">
                  En savoir plus
                </Link>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
            <button
              type="button"
              onClick={refuse}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={accept}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
