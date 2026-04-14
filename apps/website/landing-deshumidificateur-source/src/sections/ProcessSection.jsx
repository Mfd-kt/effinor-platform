import React from 'react';
import { motion } from 'framer-motion';

const ProcessSection = ({ processSteps }) => {
  return (
    <section id="processus" className="py-16 md:py-24 bg-slate-100 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y:20 }} whileInView={{ opacity: 1, y:0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-3xl text-center font-bold mb-16"
        >
          Un processus ultra-clair vers le <span className="gradient-text">100% financé</span>
        </motion.h2>
        <div className="relative max-w-4xl mx-auto">
           <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-slate-300 dark:bg-slate-700"></div>
           <div className="grid md:grid-cols-4 gap-8 md:gap-0">
            {processSteps.map((step, index) => (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="flex flex-col items-center text-center relative px-4"
              >
                <div className="bg-white dark:bg-slate-800 w-16 h-16 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary rounded-full shadow-lg mb-4 z-10">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">{step.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;