import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/sections/HeroSection';
import BenefitsSection from '@/sections/BenefitsSection';
import CeeExplainedSection from '@/sections/CeeExplainedSection';
import SocialProofSection from '@/sections/SocialProofSection';
import ProcessSection from '@/sections/ProcessSection';
import ComparisonSection from '@/sections/ComparisonSection';
import FaqSection from '@/sections/FaqSection';
import LegalPage from '@/pages/LegalPage';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import UrgencyBanner from '@/components/UrgencyBanner';
import { Droplet, Zap, Leaf, TrendingUp, Phone, Settings, Euro, FileCheck, CheckCircle, Gift } from 'lucide-react';

const navItems = [
  { label: 'Bénéfices', sectionId: 'benefices' },
  { label: 'Avis', sectionId: 'avis' },
  { label: 'Comment ça marche ?', sectionId: 'processus' },
  { label: 'FAQ', sectionId: 'faq' },
];

const benefits = [
  { icon: <Euro className="h-8 w-8 text-primary" />, title: "0 € de reste à charge", description: "Votre installation est 100% financée grâce aux primes CEE." },
  { icon: <TrendingUp className="h-8 w-8 text-primary" />, title: "+20% de rendement", description: "Boostez vos récoltes grâce à un environnement de culture optimal." },
  { icon: <Zap className="h-8 w-8 text-primary" />, title: "Jusqu'à 50% d'économies", description: "Réduisez drastiquement votre facture énergétique dès le premier jour." },
  { icon: <Droplet className="h-8 w-8 text-primary" />, title: "–30% d'humidité en 24h", description: "Éliminez les maladies et améliorez la santé de vos plantes." },
];

const ceeSteps = [
  { icon: <FileCheck className="h-10 w-10 text-primary" />, title: "1. On fait le diagnostic", description: "Gratuitement, nous vérifions votre éligibilité et les besoins de votre serre." },
  { icon: <Gift className="h-10 w-10 text-primary" />, title: "2. Les pollueurs financent", description: "Nous montons le dossier CEE. Les fournisseurs d'énergie paient pour vous." },
  { icon: <Settings className="h-10 w-10 text-primary" />, title: "3. On installe votre machine", description: "Votre déshumidificateur thermodynamique est installé et fonctionnel, sans frais." },
  { icon: <Leaf className="h-10 w-10 text-primary" />, title: "4. Vous récoltez plus", description: "Profitez d'une meilleure production et d'économies, sans avoir rien payé." },
];

const processSteps = [
  { number: "1", title: "Décrivez votre serre", description: "Remplissez notre formulaire en moins d'une minute." },
  { number: "2", title: "Confirmation d'éligibilité", description: "Recevez rapidement la confirmation de votre prise en charge à 100%." },
  { number: "3", title: "Installation sous 10 jours", description: "Nos experts installent et mettent en service votre déshumidificateur thermodynamique." },
  { number: "4", title: "Récoltez plus, sans dépenser", description: "Bénéficiez immédiatement d'une serre plus saine et plus rentable." },
];

const faqItems = [
    { q: "Est-ce vraiment 100% gratuit pour moi ?", a: "Oui. Grâce au dispositif des Certificats d'Économies d'Énergie (CEE), l'installation est financée par les 'obligés' (fournisseurs d'énergie). Dans la plupart des cas, cela couvre 100% des coûts, sans aucun reste à charge pour vous." },
    { q: "Quelles sont les conditions d'éligibilité ?", a: "Vous devez être un professionnel de l'agriculture et posséder une serre. Le mieux est de remplir notre formulaire pour une vérification gratuite et rapide de votre situation spécifique." },
    { q: "Qui s'occupe de la paperasse pour la prime CEE ?", a: "Nous ! Notre équipe gère l'intégralité du montage et du dépôt de votre dossier de financement. C'est zéro tracas administratif pour vous." },
    { q: "Y a-t-il des coûts cachés ou un abonnement ?", a: "Absolument aucun. Il n'y a ni frais cachés, ni abonnement. Vous bénéficiez de l'équipement et de son installation gratuite, puis vous profitez des économies d'énergie qu'il génère." },
];

const MainPageLayout = () => {
  const location = useLocation();
  React.useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Déshumidificateur Serre 100% Financé | Prime CEE Déshumidificateur thermodynamique</title>
        <meta name="description" content="Installez un Déshumidificateur thermodynamique sans dépenser 1€. Financé à 100% par les primes CEE. Vérifiez votre éligibilité gratuite !" />
        <meta property="og:title" content="Déshumidificateur Serre 100% Financé | Prime CEE Déshumidificateur thermodynamique" />
        <meta property="og:description" content="Installez un Déshumidificateur thermodynamique sans dépenser 1€. Financé à 100% par les primes CEE. Vérifiez votre éligibilité gratuite !" />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <Header navItems={navItems} scrollToSection={scrollToSection} />
        <main className="flex-grow">
          <HeroSection scrollToSection={scrollToSection} />
          <BenefitsSection benefits={benefits} />
          <SocialProofSection />
          <CeeExplainedSection ceeSteps={ceeSteps} />
          <ProcessSection processSteps={processSteps} />
          <ComparisonSection />
          <FaqSection faqItems={faqItems} />
        </main>
        <Footer navItems={navItems} scrollToSection={scrollToSection} />
        <CookieConsentBanner />
        <UrgencyBanner />
      </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <HelmetProvider>
        <Routes>
          <Route path="/" element={<MainPageLayout />} />
          <Route path="/mentions-legales" element={<LegalPage />} />
        </Routes>
        <Toaster />
      </HelmetProvider>
    </Router>
  );
}

export default App;