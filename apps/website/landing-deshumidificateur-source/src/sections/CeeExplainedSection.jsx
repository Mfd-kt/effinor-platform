import React from 'react';
import { motion } from 'framer-motion';

const CeeExplainedSection = ({ ceeSteps }) => {
  return (
    <section id="subvention-cee" className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
          className="bg-primary/5 dark:bg-slate-800/50 border border-primary/20 dark:border-slate-700 rounded-xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">La magie du financement CEE expliquée</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            Comment est-ce possible ? C'est simple : les pollueurs paient pour votre équipement. Zéro papier pour vous.
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {ceeSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-md mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CeeExplainedSection;