import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Euro, TrendingUp, Zap, Droplet } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    { 
      icon: <Euro className="h-8 w-8" />, 
      title: "Investissement rentable", 
      description: "Un retour sur investissement rapide grâce aux économies d'énergie générées. ROI moyen de 2 à 3 ans." 
    },
    { 
      icon: <TrendingUp className="h-8 w-8" />, 
      title: "Amélioration de la productivité", 
      description: "Créez un environnement de travail optimal pour vos équipes et vos équipements." 
    },
    { 
      icon: <Zap className="h-8 w-8" />, 
      title: "Jusqu'à 50% d'économies", 
      description: "Réduisez drastiquement votre facture énergétique dès le premier jour d'utilisation." 
    },
    { 
      icon: <Droplet className="h-8 w-8" />, 
      title: "–30% d'humidité en 24h", 
      description: "Éliminez les problèmes d'humidité, de condensation et protégez vos installations." 
    },
  ];

  return (
    <section id="benefices" className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl text-center font-bold mb-12"
        >
          Des bénéfices concrets, <span className="bg-gradient-to-r from-secondary-600 to-green-600 bg-clip-text text-transparent">un investissement rentable</span>
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="items-center">
                  <div className="bg-secondary-100 dark:bg-secondary-900/30 p-4 rounded-full inline-flex items-center justify-center mb-4">
                    <div className="text-secondary-600 dark:text-secondary-400">
                      {benefit.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl pt-2 text-slate-900 dark:text-slate-100">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;



