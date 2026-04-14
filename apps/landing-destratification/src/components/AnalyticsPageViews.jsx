import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SPA tracking helper.
 * Google tag (gtag.js) doesn't automatically track React Router route changes.
 */
export default function AnalyticsPageViews() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag !== 'function') return;

    const page_path = `${location.pathname}${location.search}${location.hash || ''}`;

    // Send virtual page_view so Google Ads audiences + reporting stay correct in SPA routing.
    window.gtag('event', 'page_view', { page_path });

    // Also update config for Ads tag (helps some setups).
    window.gtag('config', 'AW-17517661824', { page_path });
  }, [location.pathname, location.search, location.hash]);

  return null;
}

