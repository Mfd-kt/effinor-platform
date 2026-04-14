import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, TrendingUp, AlertTriangle } from 'lucide-react';
const Problem = () => {
  return <section className="section-padding bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <img alt="Schéma thermique montrant l'air chaud piégé au plafond et l'air froid au sol" loading="lazy" src="https://horizons-cdn.hostinger.com/543865db-43d7-4121-9236-45edc785718c/destratificateur_air-industriel-g5VuF.jpg" />
          </motion.div>
          <motion.div initial={{
          opacity: 0,
          x: 50
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Votre chaleur s'échappe par le toit, vos factures explosent.
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Dans les bâtiments à grande hauteur, l'air chaud, plus léger, monte et reste bloqué au plafond. Résultat : des pertes d'énergie massives, un inconfort pour vos équipes et des factures de chauffage qui grimpent en flèche.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <TrendingUp className="w-8 h-8 text-red-500 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Factures élevées</h3>
                  <p className="text-gray-600">Vous chauffez le plafond pour rien, gaspillant jusqu'à 30% de votre énergie.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Thermometer className="w-8 h-8 text-blue-500 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Inconfort thermique</h3>
                  <p className="text-gray-600">Vos collaborateurs ont froid aux pieds alors que le plafond est surchauffé.</p>
                </div>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Urgence réglementaire</h3>
                  <p className="text-gray-600">La transition énergétique et les CEE vous incitent à agir maintenant pour réduire votre consommation.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>;
};
export default Problem;