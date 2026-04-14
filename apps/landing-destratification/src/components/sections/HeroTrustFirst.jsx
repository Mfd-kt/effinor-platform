import React from 'react';
import { motion } from 'framer-motion';
import { pushEvent } from '@/lib/tracking';
import Section from '@/components/layout/Section';
import CalendarCta from '@/components/common/CalendarCta';
import EligibilityForm from '@/components/sections/EligibilityForm';

const LOGO_EDF = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/%C3%89lectricit%C3%A9_de_France_logo.svg/1280px-%C3%89lectricit%C3%A9_de_France_logo.svg.png';
const LOGO_TOTAL = 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/f7/Logo_TotalEnergies.svg/1920px-Logo_TotalEnergies.svg.png';
const HERO_IMAGE =
  'https://www.hellio.com/hs-fs/hubfs/blog-corporate-images/Communiqu%C3%A9s%20de%20presse/destratificateur-2.png?width=4028&height=1604&name=destratificateur-2.png';

const HeroTrustFirst = () => {
  const scrollToForm = () => {
    pushEvent('step1_start', { triggered_from: 'hero', building_type: '' });
    document.getElementById('form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Section variant="hero" className="pt-8 pb-12 md:pt-12 md:pb-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <img src={LOGO_EDF} alt="Électricité de France" className="h-10 md:h-12 object-contain" />
            <img src={LOGO_TOTAL} alt="TotalEnergies" className="h-10 md:h-12 object-contain" />
          </div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
            <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/BAT-TH-142%20vA54-3%20%C3%A0%20compter%20du%2001-01-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dispositif officiel BAT-TH-142</a>
            {' — '}
            <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/IND-BA-110%20v69-3%20%C3%A0%20compter%20du%2001-07-2025%20D%C3%A9stratificateur%20ou%20brasseur%20d%E2%80%99air.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">IND-BA-110</a>
          </p>

          <div className="grid lg:grid-cols-[1fr_440px] gap-8 lg:gap-10 items-start">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
                Votre chauffage chauffe le plafond, pas vos équipes.
              </h1>
              <p className="text-lg text-gray-700 mb-6 max-w-2xl">
                Déstratifiez l’air chaud, retrouvez du confort au sol et réduisez votre facture de chauffage jusqu’à 30% — installation financée par les CEE, sans avance de trésorerie.
              </p>
              <p className="text-base font-semibold text-gray-900 mb-3">
                Simulez vos économies en 30 secondes
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base transition-colors"
                >
                  <span className="sm:hidden">Vérifier mon éligibilité</span>
                  <span className="hidden sm:inline">Calculer mon éligibilité CEE</span>
                </button>
                <CalendarCta
                  position="hero"
                  variant="button"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-base transition-colors"
                  label="Être rappelé par un expert"
                />
              </div>
              <div className="mt-4 rounded-xl border border-gray-200 bg-white/70 backdrop-blur p-4 shadow-sm">
                <p className="text-xs text-gray-600">
                  Prime CEE déduite de votre devis • Dimensionnement adapté à chaque projet (visite sur site si nécessaire)
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-start gap-2 rounded-lg bg-white border border-gray-200 p-3">
                    <span className="text-lg leading-none" aria-hidden="true">💰</span>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">Jusqu’à 40&nbsp;000&nbsp;€ d’économies / an</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-white border border-gray-200 p-3">
                    <span className="text-lg leading-none" aria-hidden="true">🏭</span>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">Déjà +200 bâtiments équipés</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-white border border-gray-200 p-3">
                    <span className="text-lg leading-none" aria-hidden="true">⚡</span>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">Installation sans arrêt d’activité</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:sticky lg:top-24">
              <EligibilityForm embedded />
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

export default HeroTrustFirst;
