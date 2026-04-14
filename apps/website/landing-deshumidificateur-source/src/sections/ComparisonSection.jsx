import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, TrendingDown } from 'lucide-react';

const comparisonData = [
  {
    solution: "Aération manuelle",
    cost: "Perte d'énergie",
    efficiency: "Faible",
    savings: "Aucune",
    subsidy: "Non éligible",
    icons: { cost: <TrendingDown className="text-red-500" />, efficiency: <X className="text-red-500" />, savings: <X className="text-red-500" />, subsidy: <X className="text-red-500" /> }
  },
  {
    solution: "Chauffage classique",
    cost: "Élevé",
    efficiency: "Moyenne",
    savings: "Consomme plus",
    subsidy: "Non éligible",
    icons: { cost: <TrendingDown className="text-red-500" />, efficiency: <X className="text-orange-500" />, savings: <X className="text-red-500" />, subsidy: <X className="text-red-500" /> }
  },
  {
    solution: "Déshumidificateur thermodynamique",
    cost: "0 €",
    efficiency: "Excellente",
    savings: "–50% d'énergie",
    subsidy: "Financement 100%",
    icons: { cost: <Check className="text-green-500" />, efficiency: <Check className="text-green-500" />, savings: <Check className="text-green-500" />, subsidy: <Check className="text-green-500" /> }
  },
];

const ComparisonSection = () => {
  return (
    <section id="comparaison" className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}
          className="text-3xl text-center font-bold mb-12"
        >
          Pourquoi le déshumidificateur thermodynamique est <span className="gradient-text">la seule option logique</span> ?
        </motion.h2>

        <div className="space-y-4">
          {comparisonData.map((row, index) => (
             <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${row.solution === 'Déshumidificateur thermodynamique' ? 'bg-primary/10 border-primary shadow-2xl' : 'bg-slate-100 dark:bg-slate-800/50'}`}
            >
              <h3 className={`text-xl font-bold mb-4 ${row.solution === 'Déshumidificateur thermodynamique' && 'gradient-text'}`}>{row.solution}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2"><span className="font-semibold">Coût:</span> {row.icons.cost} {row.cost}</div>
                <div className="flex items-center gap-2"><span className="font-semibold">Efficacité:</span> {row.icons.efficiency} {row.efficiency}</div>
                <div className="flex items-center gap-2"><span className="font-semibold">Économies:</span> {row.icons.savings} {row.savings}</div>
                <div className="flex items-center gap-2"><span className="font-semibold">Subvention:</span> {row.icons.subsidy} {row.subsidy}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center font-bold text-xl p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg"
        >
          🏆 Déshumidificateur thermodynamique : la seule solution efficace ET 100% prise en charge.
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;