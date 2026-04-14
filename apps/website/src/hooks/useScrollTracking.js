// src/hooks/useScrollTracking.js
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisitEvent } from '@/lib/visitorTracker';

/**
 * Hook pour tracker le scroll profond (75%+)
 */
export const useScrollTracking = () => {
  const location = useLocation();
  const hasLoggedDeepScroll = useRef(false);

  useEffect(() => {
    // Réinitialiser quand on change de page
    hasLoggedDeepScroll.current = false;

    const handleScroll = () => {
      if (hasLoggedDeepScroll.current) return;

      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const maxScroll = doc.scrollHeight - doc.clientHeight;
      const pct = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;

      if (pct >= 75) {
        hasLoggedDeepScroll.current = true;
        logVisitEvent({
          event_type: 'scroll_deep',
          scroll_pct: pct,
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);
};

