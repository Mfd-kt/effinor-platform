import React from 'react';
import { motion } from 'framer-motion';

const ProblemSolution = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <section className="section-padding bg-light-gray">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          className="grid md:grid-cols-2 gap-12 items-stretch"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeInUp}>
            <div className="bg-red-50 p-8 rounded-lg border-l-4 border-red-500 h-full">
              <h2 className="text-3xl font-bold text-red-600 mb-4">Le Problème</h2>
              <p className="text-lg text-gray-700 mb-4">
                <strong>30% de la chaleur produite</strong> est perdue sous le plafond dans vos bâtiments.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Factures de chauffage plus élevées</li>
                <li>• Inconfort thermique pour vos occupants</li>
                <li>• Gaspillage énergétique important</li>
                <li>• Impact environnemental négatif</li>
              </ul>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <div className="bg-green-50 p-8 rounded-lg border-l-4 border-green-500 h-full">
              <h2 className="text-3xl font-bold text-green-600 mb-4">Notre Solution</h2>
              <p className="text-lg text-gray-700 mb-4">
                Installation de <strong>déstratificateurs d'air</strong> qui homogénéisent la température et réduisent la consommation énergétique.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Redistribution optimale de la chaleur</li>
                <li>• Confort thermique amélioré</li>
                <li>• Économies d'énergie significatives</li>
                <li>• Solution écologique et durable</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolution;