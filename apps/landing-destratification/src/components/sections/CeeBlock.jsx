import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Clock, Shield, Users } from 'lucide-react';

const CeeBlock = () => {
  return (
    <section className="bg-white py-16 border-t border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pourquoi l'installation peut être financée à 100% ?
          </h2>
        </motion.div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 md:p-12 shadow-lg border border-blue-100">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Dispositif national des Certificats d'Économies d'Énergie
                </h3>
                <p className="text-gray-700">
                  Les CEE sont un mécanisme public qui oblige les fournisseurs d'énergie à financer des travaux d'économie d'énergie. 
                  Ce dispositif permet de financer jusqu'à 100% de votre installation de destratificateur d'air.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/BAT-TH-142%20vA54-3%20%C3%A0%20compter%20du%2001-01-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Fiche officielle BAT-TH-142</a>
                </h3>
                <p className="text-gray-700">
                  Votre projet s'inscrit dans le cadre de la fiche d'opération standardisée BAT-TH-142, 
                  reconnue par le Ministère de la Transition Écologique. Cette fiche définit précisément les conditions 
                  d'éligibilité et le montant de la prime CEE applicable. Pour l'industrie : fiche <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/IND-BA-110%20v69-3%20%C3%A0%20compter%20du%2001-07-2025%20D%C3%A9stratificateur%20ou%20brasseur%20d%E2%80%99air.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">IND-BA-110</a>.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Prime CEE déduite de votre devis
                </h3>
                <p className="text-gray-700">
                  La prime CEE est intégrée à votre devis : vous ne faites aucune avance de trésorerie. 
                  Le montant de la prime est déduit directement du coût de l'installation. Zéro reste à charge possible.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Aucun paiement anticipé
                </h3>
                <p className="text-gray-700">
                  Vous n'avez aucun frais à avancer. L'installation est réalisée, puis la prime CEE couvre l'intégralité 
                  des coûts. Votre trésorerie n'est pas impactée.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Dossier administratif géré par notre équipe
                </h3>
                <p className="text-gray-700">
                  Notre équipe dédiée prend en charge l'intégralité du montage et du suivi du dossier CEE. 
                  Vous n'avez aucune démarche administrative à effectuer. Nous garantissons la conformité 
                  de votre dossier et son traitement dans les délais.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CeeBlock;
