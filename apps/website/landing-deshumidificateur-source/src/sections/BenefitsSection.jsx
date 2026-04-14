import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BenefitsSection = ({ benefits }) => {
  return (
    <section id="benefices" className="py-16 md:py-24 bg-slate-100 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y:20 }} whileInView={{ opacity: 1, y:0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-3xl text-center font-bold mb-12"
        >
          Des bénéfices concrets, <span className="gradient-text">un coût de 0 €</span>
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
              <Card className="h-full text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white dark:bg-slate-800">
                <CardHeader className="items-center">
                  <div className="bg-primary/10 dark:bg-emerald-500/10 p-4 rounded-full">
                    {React.cloneElement(benefit.icon, { className: "h-8 w-8 text-primary dark:text-emerald-400"})}
                  </div>
                  <CardTitle className="text-xl pt-2">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
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