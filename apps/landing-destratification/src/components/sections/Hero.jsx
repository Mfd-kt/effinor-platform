import React from 'react';
import { motion } from 'framer-motion';
import MultiStepForm from '@/components/form/MultiStepForm';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const Hero = () => {
  const scrollToForm = () => {
    document.getElementById('form-container')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const scrollToPhone = () => {
    const phoneInput = document.getElementById('telephone') || document.querySelector('input[type="tel"]');
    if (phoneInput) {
      phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => phoneInput.focus(), 500);
    } else {
      document.getElementById('form-container')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return <section id="top" className="bg-light-gray pt-12 pb-20 md:pt-20 md:pb-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots-pattern opacity-30 z-0"></div>
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <motion.div className="order-2 lg:order-1" initial={{
          opacity: 0,
          x: -50
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.8
        }}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
              Destratificateur industriel 100% financé par les CEE
            </h1>
            <p className="text-lg md:text-xl text-primary font-semibold mb-3">
              Réduisez jusqu'à 30% vos coûts de chauffage.
              <br />
              Entrepôts & usines &gt; 800 m². ROI mesurable 18–36 mois.
            </p>
            
            <p className="text-base text-gray-700 mb-6 font-medium border-l-4 border-blue-500 pl-4">
              Dispositif officiel BAT-TH-142 – Dossier géré intégralement par notre équipe dédiée.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button
                onClick={scrollToForm}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl py-6 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
              >
                Vérifier mon éligibilité CEE
              </Button>
              <Button
                variant="outline"
                onClick={scrollToPhone}
                className="border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-6 px-6 rounded-lg"
              >
                Être rappelé par un expert
              </Button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              ✅ Sans engagement<br />
              ✅ Réponse &lt; 24h<br />
              ✅ Dossier CEE géré intégralement
            </p>
            
          </motion.div>
          <motion.div className="order-1 lg:order-2" initial={{
          opacity: 0,
          x: 50
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.8,
          delay: 0.2
        }}>
            <div id="form-container">
              <MultiStepForm />
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>⚠️ Réservé aux bâtiments professionnels chauffés</strong> – Étude d'éligibilité obligatoire
          </p>
        </motion.div>
      </div>
    </section>;
};
export default Hero;