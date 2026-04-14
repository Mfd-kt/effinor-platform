import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { pushEvent } from '@/lib/tracking';

/**
 * Fires scroll_50 and scroll_75 (GA4/GTM) once per page view on the home page.
 */
export default function ScrollDepthTracker() {
  const location = useLocation();
  const fired50 = useRef(false);
  const fired75 = useRef(false);

  useEffect(() => {
    if (location.pathname !== '/') return;

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const ratio = window.scrollY / maxScroll;
      if (!fired50.current && ratio >= 0.5) {
        fired50.current = true;
        pushEvent('scroll_50', { page: 'home' });
      }
      if (!fired75.current && ratio >= 0.75) {
        fired75.current = true;
        pushEvent('scroll_75', { page: 'home' });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  return null;
}
