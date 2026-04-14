import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Scale } from 'lucide-react';
import Section from '@/components/layout/Section';

const CeeExplication = () => {
  return (
    <Section variant="panel">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center"
        >
          Comment votre installation est financée — et pourquoi c'est légal
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 space-y-4 md:space-y-0 md:flex md:items-stretch md:justify-center md:gap-4"
        >
          <div className="flex-1 bg-blue-50 rounded-xl p-5 border border-blue-100 text-center">
            <p className="font-semibold text-gray-900 mb-1">1. Fournisseurs d'énergie obligés</p>
            <p className="text-sm text-gray-600">
              EDF, TotalEnergies, etc. ont une obligation légale d'économies d'énergie.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-blue-400" />
          </div>

          <div className="flex-1 bg-emerald-50 rounded-xl p-5 border border-emerald-100 text-center">
            <p className="font-semibold text-gray-900 mb-1">2. Ils financent vos travaux</p>
            <p className="text-sm text-gray-600">
              Ils achètent des CEE en finançant des opérations d'économies d'énergie (dont la déstratification).
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-blue-400" />
          </div>

          <div className="flex-1 bg-gray-50 rounded-xl p-5 border border-gray-200 text-center">
            <p className="font-semibold text-gray-900 mb-1">3. Vous bénéficiez sans avance</p>
            <p className="text-sm text-gray-600">
              La prime CEE couvre l'équipement et l'installation. Reste à charge : 0€ si éligible.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <Scale className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-1">Ce n'est pas une subvention.</p>
            <p className="text-sm text-amber-800">
              C'est une obligation réglementaire pesant sur les fournisseurs d'énergie (Code de l'Énergie, art. L221-1). 
              Fiches officielles CEE : <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/BAT-TH-142%20vA54-3%20%C3%A0%20compter%20du%2001-01-2024.pdf" target="_blank" rel="noopener noreferrer" className="font-medium text-amber-700 underline hover:text-amber-900">BAT-TH-142</a>, <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/IND-BA-110%20v69-3%20%C3%A0%20compter%20du%2001-07-2025%20D%C3%A9stratificateur%20ou%20brasseur%20d%E2%80%99air.pdf" target="_blank" rel="noopener noreferrer" className="font-medium text-amber-700 underline hover:text-amber-900">IND-BA-110</a> (ministère de l'Écologie).
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

export default CeeExplication;
