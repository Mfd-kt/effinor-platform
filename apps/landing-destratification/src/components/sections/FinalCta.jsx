import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Section from '@/components/layout/Section';

const FinalCta = () => {
  const scrollToForm = () => {
    document.getElementById('form-container')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return (
    <Section variant="panel" className="py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{
          opacity: 0,
          x: -50
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Profitez des CEE et réduisez votre facture de chauffage
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Agissez maintenant pour un bâtiment plus confortable et plus économique. Notre audit est 100% gratuit et sans engagement.
            </p>
            <Button onClick={scrollToForm} className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-4 rounded-lg font-semibold hover:scale-105 transition-transform">
              Demandez votre devis gratuit
            </Button>
          </motion.div>
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }}>
            <img alt="Équipe d'installateurs techniques souriants posant devant un bâtiment industriel" loading="lazy" src="https://horizons-cdn.hostinger.com/543865db-43d7-4121-9236-45edc785718c/a140d0d2-8e4f-42c4-aeac-78f5591a9eac-1OjXZ.png" className="rounded-lg shadow-section-card" />
          </motion.div>
        </div>
      </div>
    </Section>
  );
};
export default FinalCta;