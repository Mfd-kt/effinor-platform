import React from 'react';
import { Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { inferEffinorSourceFromPath, trackPhoneClick } from '@/lib/effinorAnalytics';

const FloatingCallButton = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <a
      href="tel:+33978455063"
      onClick={() =>
        trackPhoneClick({ effinor_source: src, effinor_cta_location: 'floating' })
      }
      className="floating-call-btn"
      title="Appelez-nous maintenant : 09 78 45 50 63"
      aria-label="Appeler EFFINOR"
    >
      <Phone size={32} />
    </a>
  );
};

export default FloatingCallButton;