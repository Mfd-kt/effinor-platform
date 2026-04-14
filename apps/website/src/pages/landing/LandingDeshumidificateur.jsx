import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/landing/deshumidificateur/HeroSection';
import BenefitsSection from '@/components/landing/deshumidificateur/BenefitsSection';
import ProcessSection from '@/components/landing/deshumidificateur/ProcessSection';
import FaqSection from '@/components/landing/deshumidificateur/FaqSection';

const LandingDeshumidificateur = () => {
  useEffect(() => {
    // Smooth scroll to section if hash is present
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Déshumidificateur Industriel Professionnel | Effinor Lighting</title>
        <meta 
          name="description" 
          content="Déshumidificateur thermodynamique industriel de qualité pour usines, entrepôts, bâtiments agricoles. Équipement robuste, installation rapide, service professionnel." 
        />
        <meta 
          property="og:title" 
          content="Déshumidificateur Industriel Professionnel | Effinor Lighting" 
        />
        <meta 
          property="og:description" 
          content="Déshumidificateur thermodynamique industriel de qualité pour usines, entrepôts, bâtiments agricoles. Équipement robuste, installation rapide." 
        />
        <meta name="keywords" content="déshumidificateur industriel, déshumidificateur thermodynamique, usine, entrepôt, bâtiment professionnel, équipement industriel" />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <Header />
        <main className="flex-grow">
          <HeroSection />
          <BenefitsSection />
          <ProcessSection />
          <FaqSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingDeshumidificateur;

