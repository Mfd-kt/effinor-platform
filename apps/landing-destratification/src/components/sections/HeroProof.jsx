import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Ruler, Wrench } from 'lucide-react';

const HeroProof = () => {
  return (
    <section className="bg-white py-10 border-b border-gray-100">
      <div className="container mx-auto px-4 max-w-6xl space-y-8">
        {/* Cas réel immédiatement sous le hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-5 md:p-6"
        >
          <p className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Exemple concret – Entrepôt 3 000 m²
          </p>
          <div className="grid md:grid-cols-4 gap-3 text-sm text-gray-800">
            <p>• Investissement : <span className="font-semibold">0 € (financé CEE)</span></p>
            <p>• Économie annuelle : <span className="font-semibold">22 000 €</span></p>
            <p>• ROI réel : <span className="font-semibold">immédiat</span></p>
            <p>• Installation : <span className="font-semibold">2 jours sans arrêt de production</span></p>
          </div>
        </motion.div>

        {/* Preuve sociale spécifique industrie */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 text-sm text-gray-800"
        >
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-center font-semibold">
            +100 sites industriels équipés
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-center font-semibold">
            Prime CEE déduite du devis
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-center font-semibold">
            Dossier géré intégralement
          </div>
        </motion.div>

        {/* Bloc descriptif existant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Cas d’usage : -15% à -30% constatés
              </p>
              <p className="text-sm text-gray-600">
                Selon la configuration du bâtiment, l’économie est mesurée sur la facture de chauffage existante.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Étude & dimensionnement personnalisés
              </p>
              <p className="text-sm text-gray-600">
                Chaque projet est dimensionné par un bureau d’étude dédié en fonction des volumes et usages.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Installation planifiée hors production
              </p>
              <p className="text-sm text-gray-600">
                Intervention coordonnée pour limiter au maximum les impacts sur l’exploitation de votre site.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroProof;

