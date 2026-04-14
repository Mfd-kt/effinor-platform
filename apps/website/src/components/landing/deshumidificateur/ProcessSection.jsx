import React from 'react';
import { motion } from 'framer-motion';

const ProcessSection = () => {
  const processSteps = [
    { 
      number: "1", 
      title: "Décrivez votre bâtiment", 
      description: "Remplissez notre formulaire en moins d'une minute avec les informations de votre local professionnel." 
    },
    { 
      number: "2", 
      title: "Devis personnalisé", 
      description: "Recevez sous 24h un devis détaillé adapté à vos besoins et à votre budget." 
    },
    { 
      number: "3", 
      title: "Installation sous 10 jours", 
      description: "Nos experts installent et mettent en service votre déshumidificateur thermodynamique." 
    },
    { 
      number: "4", 
      title: "Profitez, sans dépenser", 
      description: "Bénéficiez immédiatement d'un environnement plus sain et plus rentable pour votre activité." 
    },
  ];

  return (
    <section id="processus" className="py-16 md:py-24 bg-slate-100 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl text-center font-bold mb-16"
        >
          Un processus simple pour <span className="bg-gradient-to-r from-secondary-600 to-green-600 bg-clip-text text-transparent">votre projet</span>
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
                <div className="bg-white dark:bg-slate-800 w-16 h-16 flex items-center justify-center text-2xl font-bold text-secondary-600 dark:text-secondary-400 border-2 border-secondary-600 dark:border-secondary-400 rounded-full shadow-lg mb-4 z-10">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;



