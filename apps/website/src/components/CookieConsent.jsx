import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    // Notifier l'app et déclencher un premier page_view après consentement
    try {
      window.dispatchEvent(new CustomEvent('cookie-consent', { detail: { status: 'accepted' } }));
      // Track la page courante maintenant (sinon on attend un changement de route)
      import('@/lib/visitorTracker').then(({ trackPageView }) => trackPageView?.());
    } catch (e) {
      // ignore
    }
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    try {
      window.dispatchEvent(new CustomEvent('cookie-consent', { detail: { status: 'declined' } }));
    } catch (e) {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-[101] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          role="dialog"
          aria-label="Cookies et traceurs"
        >
          <div className="flex items-start gap-3 sm:mb-0 max-w-3xl">
            <Cookie className="h-6 w-6 shrink-0 text-secondary-400 mt-0.5" aria-hidden />
            <p className="text-sm text-gray-200 leading-relaxed">
              Nous utilisons des cookies et traceurs pour mesurer l&apos;audience (si vous acceptez), améliorer le site
              et sécuriser les formulaires. Refuser n&apos;empêche pas la navigation.{' '}
              <Link to="/politique-confidentialite" className="underline font-medium text-white hover:text-secondary-300">
                Politique de confidentialité
              </Link>
              {' · '}
              <Link to="/mentions-legales" className="underline text-gray-300 hover:text-white">
                Mentions légales
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-3 sm:gap-4">
            <Button onClick={handleDecline} variant="outline" className="text-white border-white hover:bg-white/10 min-h-[44px]">
              Refuser
            </Button>
            <Button onClick={handleAccept} className="bg-secondary-600 hover:bg-secondary-700 min-h-[44px]">
              Accepter
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;