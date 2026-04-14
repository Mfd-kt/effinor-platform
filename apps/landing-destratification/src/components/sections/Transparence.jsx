import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText } from 'lucide-react';
import Section from '@/components/layout/Section';

const Transparence = () => {
  return (
    <Section variant="page">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center"
        >
          Ce que vous payez réellement
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 mb-6"
        >
          <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-3">
              <CheckCircle2 className="w-5 h-5" />
              Si éligible
            </div>
            <p className="text-gray-800 font-medium mb-2">0 € reste à charge.</p>
            <p className="text-sm text-gray-600">
              La prime CEE couvre l'équipement et l'installation. Vous n'avancez rien et ne payez rien pour l'opération CEE.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 font-semibold mb-3">
              <FileText className="w-5 h-5" />
              Si non éligible
            </div>
            <p className="text-gray-800 font-medium mb-2">Devis classique.</p>
            <p className="text-sm text-gray-600">
              Nous vous le disons dès l'étude. Aucune obligation d'équipement ; vous décidez en toute connaissance de cause.
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center text-sm text-gray-600"
        >
          Nous vous le disons avant de commencer. Aucune surprise.
        </motion.p>
      </div>
    </Section>
  );
};

export default Transparence;
