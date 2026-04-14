import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Thermometer, Leaf, Zap, Euro, CheckCircle } from 'lucide-react';

const KeyBenefits = () => {
  const benefits = [
    { icon: <TrendingDown className="w-12 h-12 text-blue-600" />, title: "Jusqu'à 30% d'économies", description: "Réduction significative de vos coûts de chauffage dès la première année." },
    { icon: <Thermometer className="w-12 h-12 text-orange-600" />, title: "Température homogène", description: "Confort thermique optimal dans tout le bâtiment, du sol au plafond." },
    { icon: <Leaf className="w-12 h-12 text-green-600" />, title: "Réduction CO2 jusqu'à 50%", description: "Impact environnemental positif et contribution à vos objectifs RSE." },
    { icon: <Zap className="w-12 h-12 text-yellow-600" />, title: "Conformité décret tertiaire", description: "Mise en conformité avec les obligations réglementaires." },
    { icon: <Euro className="w-12 h-12 text-blue-600" />, title: "100% financé par les CEE", description: "Zéro reste à charge grâce à l'aide financée par l'État (CEE)." },
    { icon: <CheckCircle className="w-12 h-12 text-green-600" />, title: "Installation rapide", description: "Mise en service en quelques jours sans perturbation de votre activité." }
  ];

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
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Des avantages concrets pour votre bâtiment</h2>
          <p className="text-xl text-gray-600">Plus de confort, moins de dépenses, et une mise en conformité assurée.</p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              className="bg-gray-50 p-8 rounded-lg card-shadow hover:shadow-xl transition-shadow transform hover:-translate-y-2"
              variants={{ initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } }}
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default KeyBenefits;