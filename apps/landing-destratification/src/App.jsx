import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from '@/components/layout/Header';
import Home from '@/pages/Home';
import ThankYouPage from '@/pages/ThankYouPage';
import Footer from '@/components/layout/Footer';
import StickyCta from '@/components/layout/StickyCta';
import ScrollToTop from '@/components/ScrollToTop';
import AnalyticsPageViews from '@/components/AnalyticsPageViews';
import SpaRedirectHandler from '@/components/SpaRedirectHandler';
import MentionsLegales from '@/pages/MentionsLegales';
import PolitiqueConfidentialite from '@/pages/PolitiqueConfidentialite';
import Rgpd from '@/pages/Rgpd';
import { getSiteUrl } from '@/lib/site';
import { useCalendarReturnTracking } from '@/lib/calendarTracking';

function App() {
  const siteUrl = getSiteUrl();
  const logoUrl = import.meta.env.VITE_LOGO_URL;
  useCalendarReturnTracking();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Effinor",
    ...(siteUrl ? { "url": siteUrl } : {}),
    ...(logoUrl ? { "logo": logoUrl } : {}),
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33-9-78-45-50-63",
      "contactType": "customer service"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Installation de déstratificateurs d'air",
    ...(siteUrl ? { "url": siteUrl } : {}),
    "provider": {
      "@type": "Organization",
      "name": "Effinor"
    },
    "areaServed": {
      "@type": "Country",
      "name": "FR"
    },
    "description": "Installation de déstratificateurs d'air 100% financée par les CEE pour réduire jusqu'à 30% votre facture de chauffage."
  };

  return (
    <HelmetProvider>
      <Router>
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(organizationSchema)}
          </script>
          <script type="application/ld+json">
            {JSON.stringify(serviceSchema)}
          </script>
        </Helmet>

        <ScrollToTop />
        <AnalyticsPageViews />
        <SpaRedirectHandler />
        
        <div className="min-h-screen bg-white">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/merci" element={<ThankYouPage />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/politique-de-confidentialite" element={<PolitiqueConfidentialite />} />
              <Route path="/rgpd" element={<Rgpd />} />
            </Routes>
          </main>
          <Footer />
          <StickyCta />
          <Toaster />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;