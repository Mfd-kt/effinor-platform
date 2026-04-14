import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Snowflake } from 'lucide-react';

const FourSeasons = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Une solution 2-en-1 : efficace toute l'année</h2>
          <p className="text-xl text-gray-600">Le destratificateur n'est pas seulement pour l'hiver. Il améliore votre confort et votre efficacité énergétique 365 jours par an.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Winter Card */}
          <motion.div
            className="bg-blue-50 border border-blue-200 p-8 rounded-xl shadow-lg flex flex-col"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center mb-4">
              <Snowflake className="w-12 h-12 text-blue-500 mr-4" />
              <h3 className="text-3xl font-bold text-blue-800">En Hiver</h3>
            </div>
            <p className="text-lg text-blue-700 mb-4 font-semibold">Récupérez la chaleur, réduisez les coûts.</p>
            <ul className="space-y-2 text-blue-600 list-disc list-inside flex-grow">
              <li>Fait redescendre l'air chaud piégé au plafond.</li>
              <li>Réduit l'écart de température sol/plafond à 2-3°C.</li>
              <li>Baisse la charge de travail de votre système de chauffage.</li>
              <li><strong>Résultat : -15% à -30% sur votre facture de chauffage.</strong></li>
            </ul>
          </motion.div>

          {/* Summer Card */}
          <motion.div
            className="bg-yellow-50 border border-yellow-300 p-8 rounded-xl shadow-lg flex flex-col"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center mb-4">
              <Sun className="w-12 h-12 text-yellow-500 mr-4" />
              <h3 className="text-3xl font-bold text-yellow-800">En Été</h3>
            </div>
            <p className="text-lg text-yellow-700 mb-4 font-semibold">Améliorez le confort, sans climatisation.</p>
            <ul className="space-y-2 text-yellow-600 list-disc list-inside flex-grow">
              <li>Crée un flux d'air doux et rafraîchissant.</li>
              <li>Réduit la sensation de chaleur jusqu'à 4°C.</li>
              <li>Améliore le bien-être et la productivité des équipes.</li>
              <li><strong>Résultat : Un environnement de travail plus agréable sans surcoût.</strong></li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FourSeasons;