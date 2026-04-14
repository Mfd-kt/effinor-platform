import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { pushEvent, getStoredUtms } from '@/lib/tracking';
import Section from '@/components/layout/Section';

const LOGO_EDF = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/%C3%89lectricit%C3%A9_de_France_logo.svg/1280px-%C3%89lectricit%C3%A9_de_France_logo.svg.png';
const LOGO_TOTAL = 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/f7/Logo_TotalEnergies.svg/1920px-Logo_TotalEnergies.svg.png';

const TrustBar = () => {
  const hasFiredLandingView = useRef(false);

  useEffect(() => {
    if (hasFiredLandingView.current) return;
    hasFiredLandingView.current = true;
    const utms = getStoredUtms();
    pushEvent('landing_view', {
      page_title: document.title || 'Destratificateur CEE',
      source: typeof window !== 'undefined' ? (document.referrer || 'direct') : 'direct',
      utm_source: utms.utm_source || undefined,
      utm_campaign: utms.utm_campaign || undefined,
      gclid: utms.gclid || undefined,
    });
  }, []);

  return (
    <Section variant="page" tight>
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-gray-700"
        >
          <span className="font-semibold text-gray-900">+100 bâtiments équipés</span>
          <span className="hidden md:inline text-gray-400">|</span>
          <span className="font-semibold text-gray-900">4,2M€ d'économies générées</span>
          <span className="hidden md:inline text-gray-400">|</span>
          <span>Interventions partout en France</span>
          <span className="hidden md:inline text-gray-400">|</span>
          <div className="flex items-center gap-4">
            <img loading="lazy" alt="EDF" className="h-7 grayscale opacity-80" src={LOGO_EDF} />
            <img loading="lazy" alt="TotalEnergies" className="h-7 grayscale opacity-80" src={LOGO_TOTAL} />
          </div>
          <span className="hidden md:inline text-gray-400">|</span>
          <a
            href="https://www.ecologie.gouv.fr/sites/default/files/documents/BAT-TH-142%20vA54-3%20%C3%A0%20compter%20du%2001-01-2024.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            BAT-TH-142
          </a>
          <span className="hidden md:inline text-gray-400">|</span>
          <a
            href="https://www.ecologie.gouv.fr/sites/default/files/documents/IND-BA-110%20v69-3%20%C3%A0%20compter%20du%2001-07-2025%20D%C3%A9stratificateur%20ou%20brasseur%20d%E2%80%99air.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            IND-BA-110
          </a>
          <span className="hidden md:inline text-gray-400">|</span>
          <span>Résultats mesurés sur facture énergétique</span>
        </motion.div>
      </div>
    </Section>
  );
};

export default TrustBar;
